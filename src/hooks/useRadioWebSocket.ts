
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) {
      console.log('[WS] No hay canal o usuario, saltando conexión.');
      setStatus('disconnected');
      return;
    }

    // Limpieza agresiva de instancias previas
    if (ws.current) {
      console.log('[WS] Cerrando instancia anterior antes de crear nueva.');
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onopen = null;
      ws.current.onmessage = null;
      if (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN) {
        ws.current.close(1000, 'Reconnecting');
      }
      ws.current = null;
    }

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Importante: asegurar que la URL sea correcta en entornos de cloud workstations
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      console.log(`[WS][CREATE] Intentando conectar a: ${wsUrl} | Canal: ${channel}`);
      ws.current = new WebSocket(wsUrl);
      console.log(`[WS][READY_STATE_AFTER_CREATE] State: ${ws.current.readyState} (0=CONNECTING, 1=OPEN)`);

      ws.current.onopen = () => {
        if (!isComponentMounted.current) {
          console.log('[WS][OPEN] Socket abierto pero el componente ya no está montado. Cerrando.');
          ws.current?.close();
          return;
        }
        console.log('[WS][OPEN] Conexión establecida correctamente.');
        setStatus('connected');
        
        if (ws.current?.readyState === WebSocket.OPEN) {
          console.log('[WS] Enviando join_channel...');
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
          console.log(`[WS][MESSAGE] Type: ${msg.type}`);
          if (msg.type === 'channel_peers_update') {
            setPeers(msg.payload.peers || []);
          }
          onMessageRef.current(msg);
        } catch (e) {
          console.warn('[WS] Error parseando mensaje:', e);
        }
      };

      ws.current.onclose = (event) => {
        console.log(`[WS][CLOSE] code=${event.code} reason=${event.reason || 'none'} wasClean=${event.wasClean} readyState=${ws.current?.readyState}`);
        setStatus('disconnected');
        setPeers([]);
        
        // Reintento si el canal sigue activo y no fue un cierre intencionado
        if (channel && !event.wasClean && isComponentMounted.current) {
          console.log('[WS] Programando reconexión en 5s...');
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(connect, 5000);
        }
      };

      ws.current.onerror = (err) => {
        console.error('[WS][ERROR] Error detectado.', {
          url: wsUrl,
          readyState: ws.current?.readyState,
          error: err
        });
        setStatus('error');
      };
    } catch (e) {
      console.error('[WS][CRITICAL] Error durante la creación del socket:', e);
      setStatus('error');
    }
  }, [channel, userId]);

  const send = useCallback((msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId, channel }));
    } else {
      console.warn(`[WS] Intento de enviar mensaje sin conexión activa. State: ${ws.current?.readyState}`);
    }
  }, [userId, channel]);

  useEffect(() => {
    isComponentMounted.current = true;
    connect();
    
    return () => {
      console.log('[WS] Cleanup: Desmontando hook.');
      isComponentMounted.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Evitar reconexión en cleanup
        ws.current.close(1000, 'Component unmounted');
        ws.current = null;
      }
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
