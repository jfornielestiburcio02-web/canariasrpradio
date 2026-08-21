
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, PeerStats } from '@/types/radio';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function useRadioWebRTC(mySessionId: string, sendSignal: (msg: any) => void) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Map<string, PeerStats>>(new Map());

  // Inicializar micrófono una sola vez
  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    try {
      console.log('[WEBRTC] Getting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Por defecto desactivado para PTT
      stream.getAudioTracks().forEach(t => t.enabled = false);
      localStream.current = stream;
      return stream;
    } catch (e) {
      console.error('[WEBRTC] Failed to get mic:', e);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (peerConnections.current.has(remoteSessionId)) return peerConnections.current.get(remoteSessionId)!;

    console.log(`[WEBRTC][CREATED] Peer: ${remoteSessionId}`);
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][STATE] ${remoteSessionId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(remoteSessionId);
      }
    };

    pc.ontrack = (event) => {
      console.log(`[AUDIO][ONTRACK] From ${remoteSessionId}`);
      const remoteStream = event.streams[0];
      let audio = remoteAudios.current.get(remoteSessionId);
      
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      
      audio.srcObject = remoteStream;
      audio.play().then(() => console.log(`[AUDIO][PLAY] Started for ${remoteSessionId}`))
        .catch(e => console.error('[AUDIO][PLAY] Failed:', e));
    };

    if (localStream.current) {
      console.log(`[WEBRTC][ADD_TRACK] Adding local audio to ${remoteSessionId}`);
      localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
    }

    peerConnections.current.set(remoteSessionId, pc);
    return pc;
  }, [sendSignal]);

  const cleanupPeer = (sessionId: string) => {
    const pc = peerConnections.current.get(sessionId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(sessionId);
    }
    const audio = remoteAudios.current.get(sessionId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudios.current.delete(sessionId);
    }
    setActiveTransmissions(prev => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
  };

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    const from = msg.from!;
    
    switch (msg.type) {
      case 'channel_peers_update':
        const currentPeers = msg.payload.peers as string[];
        // Glare prevention: Solo iniciamos nosotros si nuestro sessionId es menor
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            if (mySessionId < peerId) {
              console.log(`[WEBRTC] Initiating offer to ${peerId}`);
              const pc = createPeerConnection(peerId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
            }
          }
        }
        // Limpieza de peers que ya no están
        peerConnections.current.forEach((_, id) => {
          if (!currentPeers.includes(id)) cleanupPeer(id);
        });
        break;

      case 'webrtc_offer':
        const pcOffer = createPeerConnection(from);
        await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await pcOffer.createAnswer();
        await pcOffer.setLocalDescription(answer);
        sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
        break;

      case 'webrtc_answer':
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
        }
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (pcIce) {
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload));
        }
        break;

      case 'ptt_start':
        setActiveTransmissions(prev => new Set(prev).add(from));
        break;

      case 'ptt_stop':
        setActiveTransmissions(prev => {
          const next = new Set(prev);
          next.delete(from);
          return next;
        });
        break;
    }
  }, [mySessionId, createPeerConnection, sendSignal]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      if (track) {
        track.enabled = enabled;
        console.log(`[AUDIO][PTT_${enabled ? 'START' : 'STOP'}] My mic is now ${enabled ? 'ON' : 'OFF'}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  useEffect(() => {
    initLocalStream();
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      remoteAudios.current.forEach(a => { a.srcObject = null; a.remove(); });
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, stats };
}
