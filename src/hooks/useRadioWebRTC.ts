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
        setIsIceReady(true);
      }
    };
    loadIceServers();
  }, []);

  // LIMPIEZA TOTAL AL SALIR DEL CANAL
  useEffect(() => {
    if (!activeChannel) {
      console.log('[CHANNEL] Usuario fuera de canal. Iniciando limpieza total...');
      
      // 1. Cerrar todas las conexiones
      peerConnections.current.forEach((pc, id) => {
        pc.close();
        console.log(`[WEBRTC] Conexión cerrada con ${id}`);
      });
      peerConnections.current.clear();

      // 2. Detener todos los audios remotos
      remoteAudios.current.forEach((audio, id) => {
        audio.pause();
        audio.srcObject = null;
        console.log(`[WEBRTC] Audio remoto detenido para ${id}`);
      });
      remoteAudios.current.clear();

      // 3. Limpiar intervalos de estadísticas
      statsIntervals.current.forEach(i => clearInterval(i));
      statsIntervals.current.clear();

      // 4. Detener micrófono local
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
        console.log('[AUDIO] Micrófono local detenido');
      }

      // 5. Resetear estados
      setActiveTransmissions(new Set());
      pendingCandidates.current.clear();
      creatingPeers.current.clear();
      
      console.log('[CHANNEL] Limpieza completada.');
    } else {
      console.log(`[CHANNEL] Usuario entrando en canal: ${activeChannel}`);
    }
  }, [activeChannel]);

  // LIMPIEZA DIFERENCIAL: Peers que abandonan el canal
  useEffect(() => {
    if (!activeChannel) return;

    peerConnections.current.forEach((pc, sessionId) => {
      if (!peersList.includes(sessionId)) {
        console.log(`[WEBRTC][CLEANUP] El par ${sessionId} ha abandonado el canal. Cerrando recursos.`);
        pc.close();
        peerConnections.current.delete(sessionId);
        
        const audio = remoteAudios.current.get(sessionId);
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          remoteAudios.current.delete(sessionId);
        }
        
        const interval = statsIntervals.current.get(sessionId);
        if (interval) {
          clearInterval(interval);
          statsIntervals.current.delete(sessionId);
        }

        setActiveTransmissions(prev => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
      }
    });
  }, [peersList, activeChannel]);

  const getCandidateType = (candidateStr: string) => {
    const parts = candidateStr.split(' ');
    if (parts.length > 7) {
      return parts[7];
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
              console.log(`[WEBRTC][STATS] peer=${peerId} | PAIR: ${local.candidateType}/${remote.candidateType} | RX=${report.bytesReceived}`);
            }
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
      if (!alreadyAdded) {
        pc.addTrack(track, localStream.current!);
      }
    });
  }, []);

  const initLocalStream = useCallback(async () => {
    if (!activeChannel) return null;
    if (localStream.current) return localStream.current;
    
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
      setMicStatus(e.name === 'NotAllowedError' ? 'denied' : 'error');
      return null;
    }
  }, [addLocalTracksToPC, activeChannel]);

  const processPendingCandidates = async (remoteSessionId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidates.current.get(remoteSessionId) || [];
    if (candidates.length > 0 && pc.remoteDescription) {
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
      pendingCandidates.current.set(remoteSessionId, []);
    }
  };

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (!activeChannel) return null;
    if (peerConnections.current.has(remoteSessionId)) {
      return peerConnections.current.get(remoteSessionId)!;
    }

    if (creatingPeers.current.has(remoteSessionId)) return null;
    creatingPeers.current.add(remoteSessionId);

    const pc = new RTCPeerConnection({
      iceServers,
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

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        monitorStats(remoteSessionId, pc);
      }
    };

    pc.ontrack = (event) => {
      if (!activeChannel) return;
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
      audio.play().catch(() => {});
    };

    if (localStream.current) addLocalTracksToPC(pc);

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
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
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
                } catch (err) {}
              }
            }
          }
        }
        break;

      case 'webrtc_offer':
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          try {
            await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pcOffer.createAnswer();
            await pcOffer.setLocalDescription(answer);
            sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
            await processPendingCandidates(from, pcOffer);
          } catch (err) {}
        }
        break;

      case 'webrtc_answer':
        const pcAnswer = peerConnections.current.get(from);
        if (pcAnswer) {
          try {
            await pcAnswer.setRemoteDescription(new RTCSessionDescription(msg.payload));
            await processPendingCandidates(from, pcAnswer);
          } catch (err) {}
        }
        break;

      case 'webrtc_ice':
        if (!msg.payload) return;
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
  }, [mySessionId, createPeerConnection, sendSignal, isIceReady, activeChannel]);

  const toggleLocalPTT = (enabled: boolean) => {
    if (!activeChannel) {
      console.warn('[PTT] Intento de transmisión bloqueado: fuera de canal');
      return;
    }
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
    if (activeChannel) {
      initLocalStream();
    }
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      statsIntervals.current.forEach(i => clearInterval(i));
    };
  }, [initLocalStream, activeChannel]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus };
}
