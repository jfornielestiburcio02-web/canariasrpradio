
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus } from '@/types/radio';

export function useRadioWebRTC(mySessionId: string, sendSignal: (msg: any) => void, peersList: string[]) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const creatingPeers = useRef<Set<string>>(new Set());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const iceServers = useRef<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');

  useEffect(() => {
    const loadIceServers = async () => {
      try {
        const res = await fetch('/api/webrtc/ice-servers');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          iceServers.current = data;
          console.log('[WEBRTC][ICE_SERVER] Configuración cargada');
        }
      } catch (err) {
        console.error('[WEBRTC][ICE_SERVER] Error cargando servidores:', err);
      }
    };
    loadIceServers();
  }, []);

  useEffect(() => {
    const peersSet = new Set(peersList);
    peerConnections.current.forEach((pc, peerId) => {
      if (!peersSet.has(peerId) && peerId !== mySessionId) {
        console.log(`[WEBRTC][CLEANUP] Peer ${peerId} abandonó el canal. Cerrando conexión.`);
        pc.close();
        peerConnections.current.delete(peerId);
        
        const audio = remoteAudios.current.get(peerId);
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          remoteAudios.current.delete(peerId);
        }
        
        setActiveTransmissions(prev => {
          const next = new Set(prev);
          next.delete(peerId);
          return next;
        });
      }
    });
  }, [peersList, mySessionId]);

  const addLocalTracksToPC = useCallback((pc: RTCPeerConnection) => {
    if (!localStream.current) return;
    localStream.current.getTracks().forEach(track => {
      const alreadyAdded = pc.getSenders().some(s => s.track === track);
      if (!alreadyAdded) pc.addTrack(track, localStream.current!);
    });
  }, []);

  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
        video: false 
      });
      
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      localStream.current = stream;
      setMicStatus('granted');
      
      peerConnections.current.forEach(pc => addLocalTracksToPC(pc));
      
      return stream;
    } catch (e: any) {
      console.error('[WEBRTC][MIC] Error:', e);
      setMicStatus(e.name === 'NotAllowedError' ? 'denied' : 'error');
      return null;
    }
  }, [addLocalTracksToPC]);

  const processPendingCandidates = async (remoteSessionId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidates.current.get(remoteSessionId) || [];
    if (candidates.length > 0 && pc.remoteDescription) {
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`[WEBRTC][ICE] Fallo al añadir candidato para ${remoteSessionId}`);
        }
      }
      pendingCandidates.current.set(remoteSessionId, []);
    }
  };

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (peerConnections.current.has(remoteSessionId)) {
      return peerConnections.current.get(remoteSessionId)!;
    }

    if (creatingPeers.current.has(remoteSessionId)) return null;
    creatingPeers.current.add(remoteSessionId);

    const pc = new RTCPeerConnection({
      iceServers: iceServers.current,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle'
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(err => console.warn('[WEBRTC][AUDIO] Error reproducción:', err));
    };

    if (localStream.current) {
      addLocalTracksToPC(pc);
    }

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [sendSignal, addLocalTracksToPC]);

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
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
          await processPendingCandidates(from, pcOffer);
        }
        break;

      case 'webrtc_answer':
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          await processPendingCandidates(from, pcAnswer);
        }
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (!msg.payload) return;
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
  }, [mySessionId, createPeerConnection, sendSignal]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      if (track) {
        track.enabled = enabled;
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  useEffect(() => {
    initLocalStream();
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      remoteAudios.current.forEach(a => { a.pause(); a.srcObject = null; });
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus };
}
