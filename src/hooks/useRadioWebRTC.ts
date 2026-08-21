
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, PeerStats } from '@/types/radio';

/**
 * Configuración de servidores ICE. 
 * Se recomienda configurar variables de entorno NEXT_PUBLIC_TURN_URL, 
 * NEXT_PUBLIC_TURN_USERNAME y NEXT_PUBLIC_TURN_PASSWORD en producción.
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
    console.log('[WEBRTC][CONFIG] Adding TURN server fallback:', turnUrl);
    iceServers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass
    });
  } else {
    console.warn('[WEBRTC][CONFIG] No TURN server configured. Fallback to STUN only.');
  }

  return { iceServers, iceTransportPolicy: 'all' };
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
      console.log('[WEBRTC] Getting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // El micro empieza apagado, el PTT lo habilitará
      stream.getAudioTracks().forEach(t => t.enabled = false);
      localStream.current = stream;
      return stream;
    } catch (e) {
      console.error('[WEBRTC] Failed to get mic:', e);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    if (peerConnections.current.has(remoteSessionId)) {
      return peerConnections.current.get(remoteSessionId)!;
    }

    if (creatingPeers.current.has(remoteSessionId)) {
      return null;
    }

    creatingPeers.current.add(remoteSessionId);
    console.log(`[WEBRTC][CREATED] Peer: ${remoteSessionId}`);
    
    const pc = new RTCPeerConnection(getIceConfig());

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate;
        console.log(`[WEBRTC][ICE_CANDIDATE] type=${c.type} protocol=${c.protocol} address=${c.address} remotePeer=${remoteSessionId}`);
        
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: c
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const iceState = pc.iceConnectionState;
      console.log(`[WEBRTC][STATE] ${remoteSessionId}: conn=${state} ice=${iceState} sig=${pc.signalingState}`);
      
      if (state === 'failed' || state === 'closed') {
        if (state === 'failed') {
          console.error(`[WEBRTC][ERROR] Connection failed with ${remoteSessionId}. Check ICE/TURN config.`);
        }
        cleanupPeer(remoteSessionId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC][ICE_STATE] ${remoteSessionId}: ${pc.iceConnectionState}`);
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
        .then(() => console.log(`[AUDIO][PLAY] Started for ${remoteSessionId}`))
        .catch(e => console.error(`[AUDIO][PLAY] Failed for ${remoteSessionId}:`, e));
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        console.log(`[WEBRTC][ADD_TRACK] Adding local audio to ${remoteSessionId}`);
        pc.addTrack(track, localStream.current!);
      });
    }

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [sendSignal]);

  const cleanupPeer = (sessionId: string) => {
    console.log(`[WEBRTC][CLEANUP] Peer: ${sessionId}`);
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
            // Glare prevention: solo el ID menor inicia
            if (mySessionId < peerId) {
              console.log(`[WEBRTC] Initiating offer to ${peerId}`);
              const pc = createPeerConnection(peerId);
              if (pc) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'webrtc_offer', to: peerId, payload: offer });
              }
            }
          }
        }
        // Limpiar peers que se han ido
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
        console.log(`[AUDIO][PTT_${enabled ? 'START' : 'STOP'}] My mic is now ${enabled ? 'ON' : 'OFF'}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  // Monitor de estadísticas e ICE
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const [id, pc] of peerConnections.current) {
        if (pc.connectionState !== 'connected') continue;
        
        const stats = await pc.getStats();
        const audio = remoteAudios.current.get(id);
        const last = lastStats.current.get(id) || { sent: 0, received: 0 };
        
        let outbound: any = null;
        let inbound: any = null;
        let transport: any = null;

        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'audio') outbound = report;
          if (report.type === 'inbound-rtp' && report.kind === 'audio') inbound = report;
          if (report.type === 'transport') transport = report;
        });

        // Log del par de candidatos seleccionado
        if (transport && transport.selectedCandidatePairId) {
          const pair = stats.get(transport.selectedCandidatePairId);
          if (pair) {
            const local = stats.get(pair.localCandidateId);
            const remote = stats.get(pair.remoteCandidateId);
            if (local && remote) {
              console.log(`[WEBRTC][ICE_SELECTED_PAIR] local=${local.candidateType} remote=${remote.candidateType} peer=${id}`);
            }
          }
        }

        if (outbound) {
          const delta = outbound.bytesSent - last.sent;
          if (delta > 0) {
            console.log(`[WEBRTC][OUTBOUND] peer=${id} bytesSent=${outbound.bytesSent} delta=${delta}`);
          }
          last.sent = outbound.bytesSent;
        }

        if (inbound) {
          const delta = inbound.bytesReceived - last.received;
          if (delta > 0) {
            console.log(`[WEBRTC][INBOUND] peer=${id} bytesReceived=${inbound.bytesReceived} delta=${delta} packetsLost=${inbound.packetsLost} jitter=${inbound.jitter.toFixed(4)}`);
          }
          last.received = inbound.bytesReceived;
        }

        if (audio) {
          // Si hay bytes entrando pero el audio está pausado o en readyState bajo, hay un problema de reproducción
          if (inbound && inbound.bytesReceived > 0 && (audio.paused || audio.readyState < 2)) {
            console.warn(`[AUDIO][ELEMENT_ISSUE] peer=${id} has data but element is paused/not-ready. rs=${audio.readyState}`);
          }
        }

        lastStats.current.set(id, last);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
