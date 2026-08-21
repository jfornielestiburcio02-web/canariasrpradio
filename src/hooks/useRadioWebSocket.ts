
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) return;

    // Limpieza de intentos previos
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setConnected(true);
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

      ws.current.onclose = () => {
        setConnected(false);
        setPeers([]);
        // Reintento silencioso cada 5 segundos si el canal sigue activo
        if (channel) {
          reconnectTimeout.current = setTimeout(connect, 5000);
        }
      };

      ws.current.onerror = () => {
        // El error se maneja en onclose para el reintento
        setConnected(false);
      };
    } catch (e) {
      setConnected(false);
    }
  }, [channel, userId]);

  const send = useCallback((msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId, channel }));
    }
  }, [userId, channel]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Evitar reconexión al desmontar
        ws.current.close();
      }
    };
  }, [connect]);

  return { connected, peers, send, setOnMessage };
}
