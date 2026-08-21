'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus } from '@/types/radio';

/**
 * Configuración ICE optimizada para P2P (STUN únicamente).
 * Se eliminan referencias a TURN por requisito del sistema.
 */
const getIceConfig = (): RTCConfiguration => {
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: 10
  };
};

export function useRadioWebRTC(mySessionId: string, sendSignal: (msg: any) => void) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const creatingPeers = useRef<Set<string>>(new Set());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');
  const [connectionStats, setConnectionStats] = useState<Map<string, any>>(new Map());

  // Añade las pistas locales a un PeerConnection específico
  const addLocalTracksToPC = useCallback((pc: RTCPeerConnection) => {
    if (!localStream.current) {
      console.warn('[WEBRTC][TRACK] No hay stream local para añadir al PC');
      return;
    }
    console.log('[WEBRTC][TRACK] Añadiendo pistas locales al PC');
    localStream.current.getTracks().forEach(track => {
      const alreadyAdded = pc.getSenders().some(s => s.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, localStream.current!);
      }
    });
  }, []);

  // Inicialización del micrófono (una sola vez)
  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    console.log('[WEBRTC][MIC] Requesting microphone permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      console.log('[WEBRTC][MIC] Permission granted. Tracks:', stream.getAudioTracks().length);
      // Silenciado por defecto (PTT controlará enabled)
      stream.getAudioTracks().forEach(track => { 
        track.enabled = false; 
        console.log(`[WEBRTC][MIC] Track ${track.id} state: ${track.readyState}`);
      });
      
      localStream.current = stream;
      setMicStatus('granted');
      return stream;
    } catch (e: any) {
      console.error('[WEBRTC][MIC] getUserMedia error:', e.name, e.message);
      setMicStatus(e.name === 'NotAllowedError' ? 'denied' : 'error');
      return null;
    }
  }, []);

  // Procesa candidatos ICE en cola
  const processPendingCandidates = async (remoteSessionId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidates.current.get(remoteSessionId) || [];
    if (candidates.length > 0 && pc.remoteDescription) {
      console.log(`[WEBRTC][ICE] Aplicando ${candidates.length} candidatos en cola para ${remoteSessionId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`[WEBRTC][ICE] Fallo al añadir candidato en cola:`, e);
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

    console.log(`[WEBRTC][CONNECTION] Iniciando PeerConnection para: ${remoteSessionId}`);
    const pc = new RTCPeerConnection(getIceConfig());

    pc.onicegatheringstatechange = () => {
      console.log(`[WEBRTC][ICE] Gathering state: ${pc.iceGatheringState} (peer=${remoteSessionId})`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE] Connection state: ${pc.iceConnectionState} (peer=${remoteSessionId})`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WEBRTC][ICE] Fallo en la conexión P2P con ${remoteSessionId}. STUN no pudo encontrar ruta.`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][CONNECTION] State for ${remoteSessionId}: ${pc.connectionState}`);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WEBRTC][ICE] Enviando candidato ${event.candidate.type} a ${remoteSessionId}`);
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      } else {
        console.log(`[WEBRTC][ICE] Fin de candidatos para ${remoteSessionId}`);
        sendSignal({ type: 'webrtc_ice', to: remoteSessionId, payload: null });
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
      audio.srcObject = event.streams[0];
      
      audio.play().catch(e => {
        console.warn(`[WEBRTC][AUDIO] Autoplay bloqueado para ${remoteSessionId}. Requiere interacción.`);
      });
    };

    // Añadir pistas locales antes de la negociación
    addLocalTracksToPC(pc);

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [sendSignal, addLocalTracksToPC]);

  const handleSignal = useCallback(async (msg: SignalingMessage) => {
    const from = msg.from!;
    
    // Ignorar mensajes no dirigidos a mí (a menos que sea broadcast de peers)
    if (msg.to && msg.to !== mySessionId && msg.type !== 'channel_peers_update') return;

    // Asegurarse de tener el micro antes de negociar
    if (!localStream.current && ['webrtc_offer', 'channel_peers_update'].includes(msg.type)) {
      await initLocalStream();
    }

    switch (msg.type) {
      case 'channel_peers_update':
        const currentPeers = msg.payload.peers as string[];
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            // Anti-glare: el ID menor inicia
            if (mySessionId < peerId) {
              const pc = createPeerConnection(peerId);
              if (pc) {
                console.log(`[WEBRTC][OFFER] Creando oferta para ${peerId}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
              }
            }
          }
        }
        break;

      case 'webrtc_offer':
        console.log(`[WEBRTC][OFFER] Recibida de ${from}`);
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pcOffer.createAnswer();
          await pcOffer.setLocalDescription(answer);
          console.log(`[WEBRTC][ANSWER] Enviando a ${from}`);
          sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
          await processPendingCandidates(from, pcOffer);
        }
        break;

      case 'webrtc_answer':
        console.log(`[WEBRTC][ANSWER] Recibida de ${from}`);
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          await processPendingCandidates(from, pcAnswer);
        }
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (!msg.payload) {
          console.log(`[WEBRTC][ICE] Fin de candidatos de ${from}`);
          return;
        }
        if (pcIce && pcIce.remoteDescription) {
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload))
            .catch(e => console.warn(`[WEBRTC][ICE] Error addCandidate:`, e.name));
        } else {
          console.log(`[WEBRTC][ICE] Encolando candidato de ${from}`);
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
  }, [mySessionId, createPeerConnection, sendSignal, initLocalStream]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      if (track) {
        track.enabled = enabled;
        console.log(`[WEBRTC][AUDIO] Mi micrófono está ahora ${enabled ? 'ENCENDIDO' : 'APAGADO'}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    } else {
      initLocalStream().then(stream => {
        if (stream) {
          const track = stream.getAudioTracks()[0];
          if (track) track.enabled = enabled;
          sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
        }
      });
    }
  };

  // Monitor de estadísticas RTP y tipo de candidato
  useEffect(() => {
    const interval = setInterval(async () => {
      const newStats = new Map();
      for (const [id, pc] of peerConnections.current) {
        if (pc.connectionState !== 'connected') continue;
        
        try {
          const stats = await pc.getStats();
          let inbound = { bytes: 0, packets: 0 };
          let outbound = { bytes: 0, packets: 0 };
          let candidateType = 'unknown';

          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              inbound = { bytes: report.bytesReceived, packets: report.packetsReceived };
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              outbound = { bytes: report.bytesSent, packets: report.packetsSent };
            }
            if (report.type === 'transport' && report.selectedCandidatePairId) {
              const pair = stats.get(report.selectedCandidatePairId);
              if (pair) {
                const local = stats.get(pair.localCandidateId);
                candidateType = local?.candidateType || 'unknown';
              }
            }
          });

          if (outbound.bytes > 0 || inbound.bytes > 0) {
            console.log(`[WEBRTC][STATS] peer=${id} RX=${inbound.bytes} TX=${outbound.bytes} TYPE=${candidateType}`);
          }
          newStats.set(id, { inbound, outbound, candidateType });
        } catch (e) {}
      }
      setConnectionStats(newStats);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    initLocalStream();
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      remoteAudios.current.forEach(a => { a.pause(); a.srcObject = null; });
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus, initLocalStream, connectionStats };
}
