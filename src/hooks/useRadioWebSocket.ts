'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage, WSStatus } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});
  const isComponentMounted = useRef(true);

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
      console.log(`[WS][CREATE] ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (!isComponentMounted.current) return;
        console.log('[WS][OPEN] Connected');
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
          console.warn('[WS] Parse error', e);
        }
      };

      ws.current.onclose = (e) => {
        console.log(`[WS][CLOSE] ${e.code}`);
        if (isComponentMounted.current) {
          setStatus('disconnected');
          setPeers([]);
        }
      };

      ws.current.onerror = () => {
        if (isComponentMounted.current) setStatus('error');
      };
    } catch (e) {
      console.error('[WS][CRITICAL]', e);
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
      if (ws.current) ws.current.close();
    };
  }, [connect]);

  return { status, peers, send, setOnMessage };
}