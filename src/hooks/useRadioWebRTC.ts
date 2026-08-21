'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, PeerStats } from '@/types/radio';

/**
 * Configuración de servidores ICE con soporte TURN.
 * Se utilizan variables de entorno para evitar hardcodear credenciales.
 */
const getIceConfig = (): RTCConfiguration => {
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_PASSWORD;

  if (turnUrl) {
    console.log('[WEBRTC][ICE_SERVER] Adding TURN server:', turnUrl);
    iceServers.push({
      urls: turnUrl.split(','), // Soporta múltiples URLs separadas por coma
      username: turnUser,
      credential: turnPass
    });
  } else {
    console.warn('[WEBRTC][ICE_SERVER] No TURN server configured. Only STUN (srflx/host) will be used.');
  }

  return { 
    iceServers, 
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle'
  };
};

export function useRadioWebRTC(mySessionId: string, sendSignal: (msg: any) => void) {
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const creatingPeers = useRef<Set<string>>(new Set());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const lastStats = useRef<Map<string, { sent: number; received: number }>>(new Map());
  
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [statsMap, setStatsMap] = useState<Map<string, PeerStats>>(new Map());

  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    try {
      console.log('[WEBRTC] Initializing getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // El micro empieza apagado, el PTT lo habilitará mediante .enabled = true
      stream.getAudioTracks().forEach(t => t.enabled = false);
      localStream.current = stream;
      return stream;
    } catch (e) {
      console.error('[WEBRTC] Failed to get local audio stream:', e);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    // Evitar duplicados
    if (peerConnections.current.has(remoteSessionId)) {
      return peerConnections.current.get(remoteSessionId)!;
    }

    // Prevención de creación simultánea durante negociaciones
    if (creatingPeers.current.has(remoteSessionId)) {
      return null;
    }

    creatingPeers.current.add(remoteSessionId);
    console.log(`[WEBRTC][CREATED] PeerConnection for: ${remoteSessionId}`);
    
    const pc = new RTCPeerConnection(getIceConfig());

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate;
        console.log(`[WEBRTC][ICE_CANDIDATE] type=${c.type} protocol=${c.protocol} address=${c.address} peer=${remoteSessionId}`);
        
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: c
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][CONNECTION_STATE] peer=${remoteSessionId} state=${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        console.error(`[WEBRTC][ERROR] Connection failed for ${remoteSessionId}. Check if TURN is required.`);
        cleanupPeer(remoteSessionId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE_STATE] peer=${remoteSessionId} state=${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        cleanupPeer(remoteSessionId);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const track = event.track;
      
      console.log(`[AUDIO][ONTRACK] From ${remoteSessionId} | Kind: ${track.kind} | State: ${track.readyState}`);
      
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      
      audio.srcObject = remoteStream;
      audio.volume = 1.0;
      audio.muted = false;

      audio.play()
        .then(() => console.log(`[AUDIO][PLAY] Started playback for ${remoteSessionId}`))
        .catch(e => console.error(`[AUDIO][PLAY] Playback failed for ${remoteSessionId}:`, e));
    };

    // Añadir pista local si ya existe
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        console.log(`[WEBRTC][ADD_TRACK] Adding local audio track to ${remoteSessionId}`);
        pc.addTrack(track, localStream.current!);
      });
    }

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [sendSignal]);

  const cleanupPeer = (sessionId: string) => {
    console.log(`[WEBRTC][CLEANUP] Removing peer: ${sessionId}`);
    const pc = peerConnections.current.get(sessionId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(sessionId);
    }
    const audio = remoteAudios.current.get(sessionId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      remoteAudios.current.delete(sessionId);
    }
    lastStats.current.delete(sessionId);
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
        for (const peerId of currentPeers) {
          if (peerId !== mySessionId && !peerConnections.current.has(peerId) && !creatingPeers.current.has(peerId)) {
            // Anti-glare: solo el ID menor inicia la oferta
            if (mySessionId < peerId) {
              console.log(`[WEBRTC] Anti-glare: I am initiator for ${peerId}`);
              const pc = createPeerConnection(peerId);
              if (pc) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
              }
            }
          }
        }
        // Limpiar peers que ya no están en el canal
        peerConnections.current.forEach((_, id) => {
          if (!currentPeers.includes(id)) cleanupPeer(id);
        });
        break;

      case 'webrtc_offer':
        const pcOffer = createPeerConnection(from);
        if (pcOffer) {
          await pcOffer.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pcOffer.createAnswer();
          await pcOffer.setLocalDescription(answer);
          sendSignal({ type: 'webrtc_answer', to: from, payload: answer });
        }
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
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload))
            .catch(e => console.warn(`[WEBRTC][ICE] Failed to add candidate from ${from}:`, e));
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
        console.log(`[AUDIO][PTT_${enabled ? 'START' : 'STOP'}] My track.enabled = ${enabled}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  // Monitor de estadísticas e ICE (Reportes RTP reales)
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const [id, pc] of peerConnections.current) {
        if (pc.connectionState !== 'connected') continue;
        
        const stats = await pc.getStats();
        const last = lastStats.current.get(id) || { sent: 0, received: 0 };
        
        let outbound: any = null;
        let inbound: any = null;
        let transport: any = null;

        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'audio') outbound = report;
          if (report.type === 'inbound-rtp' && report.kind === 'audio') inbound = report;
          if (report.type === 'transport') transport = report;
        });

        // Reportar el par de candidatos seleccionado (Diagnóstico ICE definitivo)
        if (transport && transport.selectedCandidatePairId) {
          const pair = stats.get(transport.selectedCandidatePairId);
          if (pair) {
            const local = stats.get(pair.localCandidateId);
            const remote = stats.get(pair.remoteCandidateId);
            if (local && remote) {
              console.log(`[WEBRTC][SELECTED_CANDIDATE_PAIR] peer=${id} local=${local.candidateType} remote=${remote.candidateType} protocol=${local.protocol}`);
            }
          }
        }

        if (outbound) {
          const delta = outbound.bytesSent - last.sent;
          if (delta > 0) {
            console.log(`[WEBRTC][OUTBOUND] peer=${id} bytesSent=${outbound.bytesSent} delta=${delta} pPTT=${activeTransmissions.has(mySessionId)}`);
          }
          last.sent = outbound.bytesSent;
        }

        if (inbound) {
          const delta = inbound.bytesReceived - last.received;
          if (delta > 0) {
            console.log(`[WEBRTC][INBOUND] peer=${id} bytesReceived=${inbound.bytesReceived} delta=${delta} jitter=${inbound.jitter?.toFixed(4)}`);
          }
          last.received = inbound.bytesReceived;
        }

        lastStats.current.set(id, last);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mySessionId, activeTransmissions]);

  useEffect(() => {
    initLocalStream();
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnections.current.forEach(pc => pc.close());
      remoteAudios.current.forEach(a => { a.pause(); a.srcObject = null; a.remove(); });
    };
  }, [initLocalStream]);

  return { handleSignal, toggleLocalPTT, activeTransmissions, statsMap };
}
