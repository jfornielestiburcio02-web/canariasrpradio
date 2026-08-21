
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimeout = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (watchdogTimeout.current) clearTimeout(watchdogTimeout.current);

    if (!channel || !userId) {
      console.log('[WS] No hay canal o usuario, saltando conexión.');
      setStatus('disconnected');
      return;
    }

    // Limpiar cualquier socket previo antes de intentar conectar
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onopen = null;
      ws.current.onmessage = null;
      if (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      ws.current = null;
    }

    console.log('[WS][BEFORE_CREATE]');
    setStatus('connecting');
    
    // Generar la URL basada en el host actual. 
    // El proxy de Studio mapeará wss://... a la instancia interna correcta.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      console.log(`[WS][CREATE] Intentando conectar a: ${wsUrl} | Canal: ${channel}`);
      ws.current = new WebSocket(wsUrl);
      console.log(`[WS][READY_STATE_AFTER_CREATE] State: ${ws.current.readyState}`);

      // Watchdog de 10 segundos para detectar handshakes bloqueados
      watchdogTimeout.current = setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
          console.error(`[WS][TIMEOUT] El handshake lleva 10s bloqueado en CONNECTING.`);
          if (isComponentMounted.current) {
            setStatus('error');
            ws.current.close();
          }
        }
      }, 10000);

      ws.current.onopen = () => {
        if (watchdogTimeout.current) clearTimeout(watchdogTimeout.current);
        
        if (!isComponentMounted.current) {
          ws.current?.close();
          return;
        }

        console.log('[WS][OPEN] ¡Conexión establecida!');
        setStatus('connected');
        
        // Registrarse en el canal
        ws.current?.send(JSON.stringify({
          type: 'join_channel',
          channel,
          from: userId,
          payload: { userId }
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
          console.warn('[WS] Error parseando mensaje:', e);
        }
      };

      ws.current.onclose = (event) => {
        if (watchdogTimeout.current) clearTimeout(watchdogTimeout.current);
        
        console.log(`[WS][CLOSE] code=${event.code} reason=${event.reason || 'none'} wasClean=${event.wasClean}`);
        
        if (isComponentMounted.current) {
          setStatus('disconnected');
          setPeers([]);
          // Reconexión si el cierre no fue intencionado
          if (channel && !event.wasClean) {
            reconnectTimeout.current = setTimeout(connect, 5000);
          }
        }
      };

      ws.current.onerror = (err) => {
        if (watchdogTimeout.current) clearTimeout(watchdogTimeout.current);
        console.error(`[WS][ERROR] Error de red. URL: ${wsUrl}`);
        if (isComponentMounted.current) {
          setStatus('error');
        }
      };
    } catch (e) {
      console.error('[WS][CRITICAL] Fallo al instanciar WebSocket:', e);
      setStatus('error');
    }
  }, [channel, userId]);

  const send = useCallback((msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId, channel }));
    }
  }, [userId, channel]);

  useEffect(() => {
    isComponentMounted.current = true;
    connect();
    
    return () => {
      isComponentMounted.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (watchdogTimeout.current) clearTimeout(watchdogTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
