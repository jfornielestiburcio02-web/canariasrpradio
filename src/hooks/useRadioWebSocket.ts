
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

/**
 * Hook de WebSocket optimizado para despliegues en Vercel y Cloud Workstations.
 * Detecta automáticamente si debe usar WSS para conexiones seguras.
 */
export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const isComponentMounted = useRef(true);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const connectionIdCounter = useRef(0);
  const currentConnectionId = useRef<number | null>(null);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) {
      setStatus('disconnected');
      setPeers([]);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    const connId = ++connectionIdCounter.current;
    currentConnectionId.current = connId;

    if (ws.current) {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    }

    setStatus('connecting');
    
    // Detección automática de protocolo seguro (WSS) para Vercel
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Si estamos en Vercel, el servidor de sockets debe estar en la misma URL 
    // pero manejado por el servidor custom. Si no hay servidor custom (Vercel serverless), 
    // fallará silenciosamente. En Workstations funciona por el proxy de puertos.
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        if (!isComponentMounted.current || currentConnectionId.current !== connId) return;
        setStatus('connected');
        socket.send(JSON.stringify({
          type: 'join_channel',
          channel,
          from: userId
        }));
      };

      socket.onmessage = (event) => {
        if (currentConnectionId.current !== connId) return;
        if (!event.data) return;
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          if (msg.type === 'channel_peers_update') {
            setPeers(msg.payload.peers || []);
          }
          onMessageRef.current(msg);
        } catch (e) {}
      };

      socket.onclose = (e) => {
        if (currentConnectionId.current !== connId) return;
        if (isComponentMounted.current && channel) {
          setStatus('disconnected');
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      socket.onerror = () => {
        if (currentConnectionId.current !== connId) return;
        setStatus('error');
      };

    } catch (e) {
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
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
