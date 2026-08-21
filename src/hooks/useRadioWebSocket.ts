
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RadioChannel, SignalingMessage } from '@/types/radio';

export function useRadioWebSocket(userId: string, channel: RadioChannel | null) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const onMessageRef = useRef<(msg: SignalingMessage) => void>(() => {});

  const setOnMessage = (callback: (msg: SignalingMessage) => void) => {
    onMessageRef.current = callback;
  };

  const connect = useCallback(() => {
    if (!channel || !userId) return;

    // Determinamos la URL del WS (usualmente el mismo host en desarrollo o producción)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/radio`;

    console.log(`[WS] Connecting to ${wsUrl}...`);
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WS] Connection established');
        setConnected(true);
        send({
          type: 'join_channel',
          channel,
          payload: { userId }
        });
      };

      ws.current.onmessage = (event) => {
        const msg: SignalingMessage = JSON.parse(event.data);
        if (msg.type === 'channel_peers_update') {
          setPeers(msg.payload.peers);
        }
        onMessageRef.current(msg);
      };

      ws.current.onclose = () => {
        console.log('[WS] Connection closed');
        setConnected(false);
        setPeers([]);
      };

      ws.current.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (e) {
      console.error('[WS] Setup failed:', e);
    }
  }, [channel, userId]);

  const send = (msg: Partial<SignalingMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...msg, from: userId }));
    } else {
      console.warn('[WS] Cannot send, socket not open');
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { connected, peers, send, setOnMessage };
}
