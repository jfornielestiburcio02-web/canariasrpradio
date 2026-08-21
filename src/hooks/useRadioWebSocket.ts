
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) {
      setStatus('disconnected');
      return;
    }

    // Limpieza de intentos previos
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.close();
      ws.current = null;
    }

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      console.log(`[WS] Intentando conectar a ${wsUrl} para el canal ${channel}...`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WS][OPEN] Conexión establecida con el servidor.');
        setStatus('connected');
        
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'join_channel',
            channel,
            from: userId,
            payload: { userId }
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          if (msg.type === 'channel_peers_update') {
            setPeers(msg.payload.peers || []);
          }
          onMessageRef.current(msg);
        } catch (e) {
          // Ignorar mensajes mal formateados
        }
      };

      ws.current.onclose = (event) => {
        console.log(`[WS][CLOSE] code=${event.code} reason=${event.reason || 'none'} wasClean=${event.wasClean}`);
        setStatus('disconnected');
        setPeers([]);
        
        // Reintento si el canal sigue activo y no fue un cierre intencionado
        if (channel && !event.wasClean) {
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(connect, 5000);
        }
      };

      ws.current.onerror = (err) => {
        console.error('[WS][ERROR] Error en el WebSocket detectado.');
        setStatus('error');
      };
    } catch (e) {
      console.error('[WS] Error crítico durante la creación del socket:', e);
      setStatus('error');
    }
  }, [channel, userId]);

  const send = useCallback((msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId, channel }));
    } else {
      console.warn('[WS] Intento de enviar mensaje sin conexión activa.');
    }
  }, [userId, channel]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        console.log('[WS] Limpieza de componente: Cerrando WebSocket.');
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
