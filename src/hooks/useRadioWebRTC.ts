
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus, RadioChannel } from '@/types/radio';

export function useRadioWebRTC(
  mySessionId: string, 
  sendSignal: (msg: any) => void, 
  peersList: string[],
  activeChannel: RadioChannel | null
) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const statsIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');
  const [isIceReady, setIsIceReady] = useState(false);

  // Cargar servidores ICE (STUN + TURN)
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
        console.error('[WEBRTC][ICE_SERVER] Error:', err);
        setIsIceReady(true);
      }
    };
    loadIceServers();
  }, []);

  // LIMPIEZA TOTAL AL SALIR DEL CANAL
  useEffect(() => {
    if (!activeChannel) {
      console.log('[CHANNEL] Saliendo: Limpiando recursos...');
      
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();

      remoteAudios.current.forEach(audio => {
        audio.pause();
        audio.srcObject = null;
      });
      remoteAudios.current.clear();

      statsIntervals.current.forEach(i => clearInterval(i));
      statsIntervals.current.clear();

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }

      setActiveTransmissions(new Set());
      pendingCandidates.current.clear();
      console.log('[CHANNEL] Limpieza completada');
    }
  }, [activeChannel]);

  // Monitor de estadísticas para depurar P2P/TURN
  const monitorStats = (peerId: string, pc: RTCPeerConnection) => {
    if (statsIntervals.current.has(peerId)) return;
    const interval = setInterval(async () => {
      if (pc.connectionState === 'closed') {
        clearInterval(interval);
        return;
      }
      try {
        const stats = await pc.getStats();
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const local = stats.get(report.localCandidateId);
            if (local) console.log(`[WEBRTC][STATS] peer=${peerId} type=${local.candidateType}`);
          }
        });
      } catch (e) {}
    }, 5000);
    statsIntervals.current.set(peerId, interval);
  };

  const addLocalTracksToPC = useCallback((pc: RTCPeerConnection) => {
    if (!localStream.current) return;
    localStream.current.getTracks().forEach(track => {
      const alreadyAdded = pc.getSenders().some(s => s.track === track);
      if (!alreadyAdded) pc.addTrack(track, localStream.current!);
    });
  }, []);

  const initLocalStream = useCallback(async () => {
    if (!activeChannel || localStream.current) return localStream.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
        video: false 
      });
      stream.getAudioTracks().forEach(track => track.enabled = false);
      localStream.current = stream;
      setMicStatus('granted');
      peerConnections.current.forEach(pc => addLocalTracksToPC(pc));
      return stream;
    } catch (e: any) {
      console.error('[WEBRTC][MIC] Error:', e);
      setMicStatus('denied');
      return null;
    }
  }, [addLocalTracksToPC, activeChannel]);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (!activeChannel || peerConnections.current.has(remoteSessionId)) return peerConnections.current.get(remoteSessionId);

    const pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: 'all' });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'webrtc_ice', to: remoteSessionId, payload: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WEBRTC][TRACK] Recibida de ${remoteSessionId}`);
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audio.play().catch(e => console.warn('[WEBRTC][AUDIO] Play blocked:', e));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') monitorStats(remoteSessionId, pc);
    };

    if (localStream.current) addLocalTracksToPC(pc);
    peerConnections.current.set(remoteSessionId, pc);
    return pc;
  }, [iceServers, sendSignal, addLocalTracksToPC, activeChannel]);

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
    if (!activeChannel || !localStream.current) return;
    const track = localStream.current.getAudioTracks()[0];
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
