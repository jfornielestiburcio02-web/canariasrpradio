
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus, RadioChannel } from '@/types/radio';

export function useRadioWebRTC(
  mySessionId: string, 
  sendSignal: (msg: any) => void, 
  peersList: string[],
  activeChannel: RadioChannel | null
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');
  const [isIceReady, setIsIceReady] = useState(false);

  useEffect(() => {
    const loadIceServers = async () => {
      try {
        const res = await fetch('/api/webrtc/ice-servers');
        if (res.ok) {
          const data = await res.json();
          setIceServers(data);
        }
        setIsIceReady(true);
      } catch (err) {
        setIsIceReady(true);
      }
    };
    loadIceServers();
  }, []);

  useEffect(() => {
    if (!activeChannel) {
      console.log(`[WEBRTC] Limpiando conexiones por salida de canal`);
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      remoteAudios.current.forEach(audio => {
        audio.pause();
        audio.srcObject = null;
      });
      remoteAudios.current.clear();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      setActiveTransmissions(new Set());
      pendingCandidates.current.clear();
    }
  }, [activeChannel, localStream]);

  const addLocalTracksToPC = useCallback(async (pc: RTCPeerConnection, remoteSessionId: string) => {
    if (!localStream) return;
    let trackAdded = false;
    localStream.getTracks().forEach(track => {
      const alreadyAdded = pc.getSenders().some(s => s.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, localStream);
        trackAdded = true;
      }
    });

    // Si añadimos pistas después de que la conexión sea estable, re-negociamos
    if (trackAdded && pc.signalingState === 'stable') {
      console.log(`[WEBRTC] Re-negociando con ${remoteSessionId} por nuevas pistas locales`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'webrtc_offer', to: remoteSessionId, payload: offer });
    }
  }, [localStream, sendSignal]);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (!activeChannel || peerConnections.current.has(remoteSessionId)) return peerConnections.current.get(remoteSessionId);

    console.log(`[WEBRTC] Creando conexión para peer: ${remoteSessionId}`);
    const pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: 'all' });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'webrtc_ice', to: remoteSessionId, payload: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WEBRTC] Pista remota recibida de: ${remoteSessionId}`);
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audio.play().catch(() => {});
    };

    if (localStream) addLocalTracksToPC(pc, remoteSessionId);
    peerConnections.current.set(remoteSessionId, pc);
    return pc;
  }, [iceServers, sendSignal, addLocalTracksToPC, activeChannel, localStream]);

  // Asegurar que las pistas se añaden a todas las conexiones existentes cuando el stream local está listo
  useEffect(() => {
    if (localStream) {
      peerConnections.current.forEach((pc, sessionId) => {
        addLocalTracksToPC(pc, sessionId);
      });
    }
  }, [localStream, addLocalTracksToPC]);

  const initLocalStream = useCallback(async () => {
    if (!activeChannel || localStream) return localStream;
    try {
      console.log('[WEBRTC] Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
        video: false 
      });
      stream.getAudioTracks().forEach(track => track.enabled = false);
      setLocalStream(stream);
      setMicStatus('granted');
      return stream;
    } catch (e: any) {
      console.error('[WEBRTC] Micrófono denegado:', e);
      setMicStatus('denied');
      return null;
    }
  }, [activeChannel, localStream]);

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    if (!activeChannel || !isIceReady) return;
    const from = msg.from!;
    if (msg.to && msg.to !== mySessionId && msg.type !== 'channel_peers_update') return;

    switch (msg.type) {
      case 'channel_peers_update':
        const currentPeers = msg.payload.peers as string[];
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            if (mySessionId < peerId) {
              const pc = createPeerConnection(peerId);
              if (pc) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
              }
            }
          }
        }
        break;

      case 'webrtc_offer':
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pcOffer.createAnswer();
          await pcOffer.setLocalDescription(answer);
          sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
          const candidates = pendingCandidates.current.get(from) || [];
          for (const c of candidates) await pcOffer.addIceCandidate(new RTCIceCandidate(c));
          pendingCandidates.current.set(from, []);
        }
        break;

      case 'webrtc_answer':
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (pcIce && pcIce.remoteDescription) {
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload)).catch(() => {});
        } else {
          if (!pendingCandidates.current.has(from)) pendingCandidates.current.set(from, []);
          pendingCandidates.current.get(from)!.push(msg.payload);
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
  }, [mySessionId, createPeerConnection, sendSignal, isIceReady, activeChannel]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (!activeChannel || !localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = enabled;
      sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
    }
  };

  useEffect(() => {
    if (activeChannel) initLocalStream();
  }, [initLocalStream, activeChannel]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus };
}
