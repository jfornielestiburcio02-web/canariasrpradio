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
      console.log('[WS] No hay canal activo. Desconectando WebSocket.');
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
      console.log(`[WS][LIFECYCLE] Rotando conexión id=${connId - 1} -> id=${connId}`);
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    }

    setStatus('connecting');
    console.log(`[WS][CREATE] id=${connId} | Canal: ${channel}`);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    try {
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        if (!isComponentMounted.current || currentConnectionId.current !== connId) return;
        console.log(`[WS][OPEN] id=${connId} - Conectado`);
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
        console.log(`[WS][CLOSE] id=${connId} - Code: ${e.code}`);
        
        if (isComponentMounted.current && channel) {
          setStatus('disconnected');
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            console.log(`[WS][RECONNECT] Intentando reconectar id=${connId}`);
            connect();
          }, 3000);
        }
      };

      socket.onerror = (err) => {
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
