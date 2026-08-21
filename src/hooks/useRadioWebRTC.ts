
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus } from '@/types/radio';

export function useRadioWebRTC(mySessionId: string, sendSignal: (msg: any) => void, peersList: string[]) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const creatingPeers = useRef<Set<string>>(new Set());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const statsIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');
  const [isIceReady, setIsIceReady] = useState(false);

  // Cargar servidores ICE desde la API
  useEffect(() => {
    const loadIceServers = async () => {
      try {
        const res = await fetch('/api/webrtc/ice-servers');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setIceServers(data);
        setIsIceReady(true);
        console.log('[WEBRTC][ICE_SERVER] Configuración cargada y lista');
      } catch (err) {
        console.error('[WEBRTC][ICE_SERVER] Error cargando servidores:', err);
        setIsIceReady(true); // Continuar con STUN por defecto
      }
    };
    loadIceServers();
  }, []);

  const getCandidateType = (candidateStr: string) => {
    const parts = candidateStr.split(' ');
    if (parts.length > 7) {
      return parts[7]; // typ host, typ srflx, typ relay
    }
    return 'unknown';
  };

  const monitorStats = (peerId: string, pc: RTCPeerConnection) => {
    if (statsIntervals.current.has(peerId)) return;

    const interval = setInterval(async () => {
      if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        clearInterval(interval);
        statsIntervals.current.delete(peerId);
        return;
      }

      try {
        const stats = await pc.getStats();
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const local = stats.get(report.localCandidateId);
            const remote = stats.get(report.remoteCandidateId);
            if (local && remote) {
              console.log(`[WEBRTC][STATS] peer=${peerId} | SELECTED_PAIR: ${local.candidateType}/${remote.candidateType} | PROTOCOL: ${local.protocol} | BYTES: TX=${report.bytesSent} RX=${report.bytesReceived}`);
            }
          }
        });
      } catch (e) {
        // Ignorar errores de stats si el PC se está cerrando
      }
    }, 5000);

    statsIntervals.current.set(peerId, interval);
  };

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
      
      stream.getAudioTracks().forEach(track => { 
        track.enabled = false;
        console.log(`[WEBRTC][MIC] Pista inicializada: ${track.label} (State: ${track.readyState})`);
      });
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
      console.log(`[WEBRTC][ICE] Aplicando ${candidates.length} candidatos en cola para ${remoteSessionId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`[WEBRTC][ICE] Error al añadir candidato para ${remoteSessionId}`);
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

    console.log(`[WEBRTC][CREATE] PC para ${remoteSessionId} | ICE Servers: ${iceServers.length}`);

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle'
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const type = getCandidateType(event.candidate.candidate);
        console.log(`[WEBRTC][ICE] Local candidate detected: type=${type} | peer=${remoteSessionId}`);
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      } else {
        console.log(`[WEBRTC][ICE] Gathering complete para ${remoteSessionId}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE_STATE] peer=${remoteSessionId} state=${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        monitorStats(remoteSessionId, pc);
      }
      if (pc.iceConnectionState === 'failed') {
        console.error(`[WEBRTC][ICE_FAILED] La conexión con ${remoteSessionId} falló. Revise si requiere TURN.`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][CONN_STATE] peer=${remoteSessionId} state=${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        // Limpieza para permitir reintento
        pc.close();
        peerConnections.current.delete(remoteSessionId);
      }
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
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      audio.srcObject = remoteStream;
      audio.play().catch(err => {
        if (err.name !== 'NotAllowedError') console.warn('[WEBRTC][AUDIO] Error reproducción:', err);
      });
    };

    if (localStream.current) addLocalTracksToPC(pc);

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [iceServers, sendSignal, addLocalTracksToPC]);

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    const from = msg.from!;
    if (!isIceReady) return; // No procesar nada hasta tener configuración ICE
    
    if (msg.to && msg.to !== mySessionId && msg.type !== 'channel_peers_update') return;

    switch (msg.type) {
      case 'channel_peers_update':
        const currentPeers = msg.payload.peers as string[];
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            if (mySessionId < peerId) {
              const pc = createPeerConnection(peerId);
              if (pc) {
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  console.log(`[WEBRTC][OFFER] Enviando a ${peerId}`);
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
        console.log(`[WEBRTC][OFFER] Recibida de ${from}`);
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          try {
            await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pcOffer.createAnswer();
            await pcOffer.setLocalDescription(answer);
            console.log(`[WEBRTC][ANSWER] Enviando a ${from}`);
            sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
            await processPendingCandidates(from, pcOffer);
          } catch (err) {
            console.error('[WEBRTC][ANSWER] Error:', err);
          }
        }
        break;

      case 'webrtc_answer':
        console.log(`[WEBRTC][ANSWER] Recibida de ${from}`);
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
        if (!msg.payload) return;
        const type = getCandidateType(msg.payload.candidate);
        console.log(`[WEBRTC][ICE] Remote candidate detected: type=${type} | from=${from}`);
        
        const pcIce = peerConnections.current.get(from);
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
  }, [mySessionId, createPeerConnection, sendSignal, isIceReady]);

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
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      statsIntervals.current.forEach(i => clearInterval(i));
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus };
}
