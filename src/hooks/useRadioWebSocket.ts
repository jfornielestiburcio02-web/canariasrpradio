
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const isComponentMounted = useRef(true);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) {
      setStatus('disconnected');
      return;
    }

    if (ws.current) {
      ws.current.close();
    }

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      console.log(`[WS][CREATE] Intentando conectar a: ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (!isComponentMounted.current) return;
        console.log('[WS][OPEN] Conexión establecida con el servidor');
        setStatus('connected');
        ws.current?.send(JSON.stringify({
          type: 'join_channel',
          channel,
          from: userId
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          if (msg.type === 'channel_peers_update') {
            setPeers(msg.payload.peers || []);
          }
          onMessageRef.current(msg);
        } catch (e) {
          console.warn('[WS] Error al parsear mensaje', e);
        }
      };

      ws.current.onclose = (e) => {
        console.log(`[WS][CLOSE] Conexión cerrada. Code: ${e.code}, Reason: ${e.reason || 'none'}`);
        if (isComponentMounted.current) {
          setStatus('disconnected');
          setPeers([]);
          // Reintento automático
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = (err) => {
        console.error('[WS][ERROR] Error en el socket:', err);
        if (isComponentMounted.current) setStatus('error');
      };
    } catch (e) {
      console.error('[WS][CRITICAL] Fallo al crear WebSocket:', e);
      setStatus('error');
    }
  }, [channel, userId]);

  const send = useCallback((msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId, channel }));
    } else {
      console.warn('[WS][SEND] Intento de envío sin conexión activa. Estado:', ws.current?.readyState);
    }
  }, [userId, channel]);

  useEffect(() => {
    isComponentMounted.current = true;
    connect();
    return () => {
      isComponentMounted.current = false;
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
