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

  // Cargar servidores ICE desde la API
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

  // Limpieza de conexiones cuando los peers abandonan el canal
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
      if (!alreadyAdded) {
        console.log(`[WEBRTC][TRACK] Añadiendo pista local al PC`);
        pc.addTrack(track, localStream.current!);
      }
    });
  }, []);

  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    try {
      console.log('[WEBRTC][MIC] Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
        video: false 
      });
      
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      localStream.current = stream;
      setMicStatus('granted');
      
      console.log('[WEBRTC][MIC] Permiso concedido y stream inicializado');
      
      // Añadir pistas a conexiones existentes si las hay
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
      console.log(`[WEBRTC][ICE] Procesando ${candidates.length} candidatos pendientes para ${remoteSessionId}`);
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

    console.log(`[WEBRTC][CREATE] Iniciando PeerConnection para ${remoteSessionId}`);

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
      } else {
        console.log(`[WEBRTC][ICE] Recopilación de candidatos finalizada para ${remoteSessionId}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE_STATE] peer=${remoteSessionId} state=${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][STATE] peer=${remoteSessionId} state=${pc.connectionState}`);
    };

    pc.ontrack = (event) => {
      console.log(`[WEBRTC][TRACK] Recibida pista remota de ${remoteSessionId}`);
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      
      // Asegurar que usamos el stream correcto
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      audio.srcObject = remoteStream;
      
      audio.play().catch(err => {
        if (err.name !== 'NotAllowedError') {
          console.warn('[WEBRTC][AUDIO] Error reproducción:', err);
        }
      });
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
    
    // Solo procesar mensajes dirigidos a mí o actualizaciones de canal
    if (msg.to && msg.to !== mySessionId && msg.type !== 'channel_peers_update') return;

    switch (msg.type) {
      case 'channel_peers_update':
        const currentPeers = msg.payload.peers as string[];
        console.log(`[WEBRTC][SIGNAL] Usuarios en canal: ${currentPeers.length}`);
        
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            // Estrategia de negociador: el ID menor inicia la oferta
            if (mySessionId < peerId) {
              const pc = createPeerConnection(peerId);
              if (pc) {
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  console.log(`[WEBRTC][OFFER] Enviando oferta a ${peerId}`);
                  sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
                } catch (err) {
                  console.error('[WEBRTC][OFFER] Error:', err);
                }
              }
            }
          }
        }
        break;

      case 'webrtc_offer':
        console.log(`[WEBRTC][OFFER] Recibida oferta de ${from}`);
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          try {
            await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pcOffer.createAnswer();
            await pcOffer.setLocalDescription(answer);
            console.log(`[WEBRTC][ANSWER] Enviando respuesta a ${from}`);
            sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
            await processPendingCandidates(from, pcOffer);
          } catch (err) {
            console.error('[WEBRTC][ANSWER] Error:', err);
          }
        }
        break;

      case 'webrtc_answer':
        console.log(`[WEBRTC][ANSWER] Recibida respuesta de ${from}`);
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          try {
            await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
            await processPendingCandidates(from, pcAnswer);
          } catch (err) {
            console.error('[WEBRTC][REMOTE_DESC] Error:', err);
          }
        }
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (!msg.payload) return;
        
        if (pcIce && pcIce.remoteDescription) {
          pcIce.addIceCandidate(new RTCIceCandidate(msg.payload)).catch(() => {});
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
        console.log(`[AUDIO][PTT] Micrófono local: ${enabled ? 'ON' : 'OFF'}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  useEffect(() => {
    initLocalStream();
    return () => {
      console.log('[WEBRTC][LIFECYCLE] Cleanup global de WebRTC');
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      remoteAudios.current.forEach(a => { a.pause(); a.srcObject = null; });
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus };
}
