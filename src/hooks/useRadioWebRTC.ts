
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, MicStatus, RadioChannel } from '@/types/radio';

/**
 * Configuración de ICE optimizada para P2P (STUN) con fallback a TURN si se desea.
 */
const getIceConfig = (): RTCConfiguration => {
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_PASSWORD;

  if (turnUrl) {
    const urls = turnUrl.split(',').map(url => url.trim());
    console.log('[WEBRTC][ICE_SERVER] Configurando TURN:', urls);
    iceServers.push({
      urls: urls,
      username: turnUser,
      credential: turnPass
    });
  } else {
    console.log('[WEBRTC][ICE_SERVER] No hay servidor TURN. Se usará STUN (P2P).');
  }

  return { 
    iceServers, 
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
    if (!localStream.current) return;
    console.log('[WEBRTC][TRACK] Añadiendo pistas locales al PC');
    localStream.current.getTracks().forEach(track => {
      // Evitar duplicados
      const alreadyAdded = pc.getSenders().some(s => s.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, localStream.current!);
      }
    });
  }, []);

  // Inicialización del micrófono
  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    console.log('[WEBRTC][MIC] Solicitando acceso al micrófono...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      console.log('[WEBRTC][MIC] Permiso concedido. Tracks:', stream.getAudioTracks().length);
      // Por defecto silenciado hasta que se use PTT
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      localStream.current = stream;
      setMicStatus('granted');

      // Si ya hay conexiones creadas, añadirles el track ahora
      peerConnections.current.forEach(pc => addLocalTracksToPC(pc));
      
      return stream;
    } catch (e: any) {
      console.error('[WEBRTC][MIC] Error getUserMedia:', e.name);
      setMicStatus(e.name === 'NotAllowedError' ? 'denied' : 'error');
      return null;
    }
  }, [addLocalTracksToPC]);

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

    console.log(`[WEBRTC][CREATE] Iniciando PeerConnection para: ${remoteSessionId}`);
    const pc = new RTCPeerConnection(getIceConfig());

    pc.onicegatheringstatechange = () => {
      console.log(`[WEBRTC][ICE_GATHERING] peer=${remoteSessionId} state=${pc.iceGatheringState}`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE_STATE] peer=${remoteSessionId} state=${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WEBRTC][ICE_STATE] Reintentando conexión con ${remoteSessionId}...`);
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][STATE] peer=${remoteSessionId} state=${pc.connectionState}`);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WEBRTC][ICE_SENT] Envia candidato a ${remoteSessionId}: ${event.candidate.type}`);
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      } else {
        console.log(`[WEBRTC][ICE_SENT] Fin de candidatos para ${remoteSessionId}`);
      }
    };

    pc.ontrack = (event) => {
      const track = event.track;
      console.log(`[AUDIO][ONTRACK] Recibida pista remota de ${remoteSessionId}. Muted: ${track.muted}, State: ${track.readyState}`);
      
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.volume = 1.0;
      
      audio.play().catch(e => {
        console.warn(`[AUDIO][PLAY] Bloqueado para ${remoteSessionId}:`, e.name);
      });

      track.onunmute = () => console.log(`[AUDIO][TRACK] Pista de ${remoteSessionId} reactivada (unmuted)`);
      track.onmute = () => console.log(`[AUDIO][TRACK] Pista de ${remoteSessionId} silenciada (muted)`);
    };

    // Intentar añadir pistas locales inmediatamente
    addLocalTracksToPC(pc);

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
            // El menor ID inicia la oferta (anti-glare)
            if (mySessionId < peerId) {
              const pc = createPeerConnection(peerId);
              if (pc) {
                console.log(`[WEBRTC][OFFER] Iniciando oferta a ${peerId}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
              }
            }
          }
        }
        break;

      case 'webrtc_offer':
        console.log(`[WEBRTC][OFFER_RCVD] Recibida oferta de ${from}`);
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pcOffer.createAnswer();
          await pcOffer.setLocalDescription(answer);
          console.log(`[WEBRTC][ANSWER_SENT] Enviando respuesta a ${from}`);
          sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
          await processPendingCandidates(from, pcOffer);
        }
        break;

      case 'webrtc_answer':
        console.log(`[WEBRTC][ANSWER_RCVD] Recibida respuesta de ${from}`);
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          await processPendingCandidates(from, pcAnswer);
        }
        break;

      case 'webrtc_ice':
        const pcIce = peerConnections.current.get(from);
        if (pcIce && pcIce.remoteDescription) {
          console.log(`[WEBRTC][ICE_RCVD] Candidato inmediato de ${from}: ${msg.payload.type}`);
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload))
            .catch(e => console.warn(`[WEBRTC][ICE] Fallo al añadir candidato:`, e.name));
        } else {
          console.log(`[WEBRTC][ICE_RCVD] Encolando candidato de ${from}`);
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
        console.log(`[AUDIO][PTT] Micrófono ${enabled ? 'ACTIVO' : 'SILENCIADO'}`);
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

  // Monitor de estadísticas RTP
  useEffect(() => {
    const interval = setInterval(async () => {
      const newStats = new Map();
      for (const [id, pc] of peerConnections.current) {
        if (pc.connectionState !== 'connected') continue;
        
        try {
          const stats = await pc.getStats();
          let inbound = { bytes: 0, packets: 0, jitter: 0 };
          let outbound = { bytes: 0, packets: 0 };
          let candidatePair = { local: '', remote: '', type: '' };

          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              inbound = { 
                bytes: report.bytesReceived, 
                packets: report.packetsReceived,
                jitter: report.jitter
              };
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              outbound = { 
                bytes: report.bytesSent, 
                packets: report.packetsSent 
              };
            }
            if (report.type === 'transport' && report.selectedCandidatePairId) {
              const pair = stats.get(report.selectedCandidatePairId);
              if (pair) {
                const local = stats.get(pair.localCandidateId);
                const remote = stats.get(pair.remoteCandidateId);
                candidatePair = {
                  local: local?.candidateType || 'unknown',
                  remote: remote?.candidateType || 'unknown',
                  type: report.dtlsState
                };
              }
            }
          });

          newStats.set(id, { inbound, outbound, candidatePair });
          
          if (outbound.bytes > 0 || inbound.bytes > 0) {
            console.log(`[WEBRTC][STATS] peer=${id} RX=${inbound.bytes} TX=${outbound.bytes} ICE=${candidatePair.local}->${candidatePair.remote}`);
          }
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
