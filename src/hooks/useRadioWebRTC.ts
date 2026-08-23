
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus, RadioChannel } from '@/types/radio';
import { errorEmitter } from '@/firebase/error-emitter';

export function useRadioWebRTC(
  mySessionId: string, 
  sendSignal: (msg: any) => void, 
  peersList: string[],
  activeChannel: RadioChannel | null
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const ignoreOffer = useRef<Map<string, boolean>>(new Map());
  
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
      } catch (err) {
        console.error('[WEBRTC] Error cargando servidores ICE:', err);
      } finally {
        setIsIceReady(true);
      }
    };
    loadIceServers();
  }, []);

  const closeConnection = useCallback((peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }
    const audio = remoteAudios.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudios.current.delete(peerId);
    }
    makingOffer.current.delete(peerId);
    ignoreOffer.current.delete(peerId);
    setActiveTransmissions(prev => {
      const next = new Set(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (!activeChannel || peerConnections.current.has(remoteSessionId)) return peerConnections.current.get(remoteSessionId);

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendSignal({ type: 'webrtc_ice', to: remoteSessionId, payload: candidate });
      }
    };

    pc.ontrack = ({ streams: [stream] }) => {
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        // En móviles, a veces es necesario interactuar para que el audio suene
        audio.muted = false;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = stream;
      audio.play().catch(e => console.warn('[WEBRTC] Error autoplaying remote audio:', e));
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current.set(remoteSessionId, true);
        await pc.setLocalDescription();
        sendSignal({ type: 'webrtc_offer', to: remoteSessionId, payload: pc.localDescription });
      } catch (err) {
        console.error(`[WEBRTC] Error en negociación con ${remoteSessionId}:`, err);
      } finally {
        makingOffer.current.set(remoteSessionId, false);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peerConnections.current.set(remoteSessionId, pc);
    return pc;
  }, [iceServers, sendSignal, activeChannel, localStream]);

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    if (!activeChannel || !isIceReady) return;
    const from = msg.from!;
    if (msg.to && msg.to !== mySessionId) return;

    try {
      const pc = createPeerConnection(from);
      if (!pc) return;

      switch (msg.type) {
        case 'webrtc_offer':
          const offerCollision = makingOffer.current.get(from) || pc.signalingState !== 'stable';
          const isPolite = mySessionId > from;
          ignoreOffer.current.set(from, !isPolite && offerCollision);

          if (ignoreOffer.current.get(from)) return;

          await pc.setRemoteDescription(msg.payload);
          await pc.setLocalDescription();
          sendSignal({ type: 'webrtc_answer', to: from, payload: pc.localDescription });
          break;

        case 'webrtc_answer':
          await pc.setRemoteDescription(msg.payload);
          break;

        case 'webrtc_ice':
          try {
            await pc.addIceCandidate(msg.payload);
          } catch (err) {
            if (!ignoreOffer.current.get(from)) throw err;
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

        case 'channel_peers_update':
          const currentPeers = msg.payload.peers as string[];
          peerConnections.current.forEach((_, id) => {
            if (!currentPeers.includes(id)) closeConnection(id);
          });
          break;
      }
    } catch (err) {
      console.error(`[WEBRTC] Error procesando señal ${msg.type} de ${from}:`, err);
    }
  }, [mySessionId, createPeerConnection, closeConnection, sendSignal, isIceReady, activeChannel]);

  const initLocalStream = useCallback(async () => {
    if (localStream) return localStream;
    try {
      console.log('[WEBRTC] Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        }, 
        video: false 
      });
      
      // Muteamos inicialmente el track para que el PTT lo active
      stream.getAudioTracks().forEach(track => track.enabled = false);
      setLocalStream(stream);
      setMicStatus('granted');
      return stream;
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        console.warn('[WEBRTC] Permiso de micrófono denegado.');
        setMicStatus('denied');
      } else {
        console.error('[WEBRTC] Error al acceder al micrófono:', e);
        setMicStatus('error');
      }
      return null;
    }
  }, [localStream]);

  useEffect(() => {
    if (activeChannel) {
      initLocalStream();
    } else {
      peerConnections.current.forEach((_, id) => closeConnection(id));
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      setMicStatus('prompt');
    }
  }, [activeChannel, initLocalStream, closeConnection]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = enabled;
      sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
    }
  };

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus, initLocalStream };
}
