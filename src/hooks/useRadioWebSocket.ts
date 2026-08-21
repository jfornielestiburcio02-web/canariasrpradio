
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
  const connectionIdCounter = useRef(0);
  const currentConnectionId = useRef<number | null>(null);

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) {
      setStatus('disconnected');
      return;
    }

    const connId = ++connectionIdCounter.current;
    currentConnectionId.current = connId;

    if (ws.current) {
      console.log(`[WS][LIFECYCLE] Cerrando socket id=${connId - 1} para abrir id=${connId}`);
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    }

    setStatus('connecting');
    console.log(`[WS][CREATE] id=${connId} | Canal: ${channel} | Usuario: ${userId}`);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        if (!isComponentMounted.current || currentConnectionId.current !== connId) return;
        console.log(`[WS][OPEN] id=${connId} - Conexión establecida`);
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
        } catch (e) {
          console.warn(`[WS][MESSAGE] id=${connId} - Error al parsear JSON del WebSocket`, e);
        }
      };

      socket.onclose = (e) => {
        if (currentConnectionId.current !== connId) return;
        console.log(`[WS][CLOSE] id=${connId} - Code: ${e.code}`);
        
        if (isComponentMounted.current) {
          setStatus('disconnected');
          setPeers([]);
          
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            console.log(`[WS][LIFECYCLE] Reintentando conexión id=${connId}`);
            connect();
          }, 3000);
        }
      };

      socket.onerror = (err) => {
        if (currentConnectionId.current !== connId) return;
        console.error(`[WS][ERROR] id=${connId}`, err);
        setStatus('error');
      };

    } catch (e) {
      console.error(`[WS][CRITICAL] id=${connId} - Fallo fatal`, e);
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
      console.log(`[WS][LIFECYCLE] Cleanup - Desmontando sesión`);
      isComponentMounted.current = false;
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.onmessage = null;
        ws.current.onopen = null;
        ws.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}
