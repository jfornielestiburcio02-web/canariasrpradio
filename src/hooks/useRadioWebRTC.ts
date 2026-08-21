
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, PeerStats, MicStatus } from '@/types/radio';

/**
 * Configuración de servidores ICE con soporte TURN mediante variables de entorno.
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
    const urls = turnUrl.split(',').map(url => url.trim());
    console.log('[WEBRTC][ICE_SERVER] Configuring TURN servers:', urls);
    iceServers.push({
      urls: urls,
      username: turnUser,
      credential: turnPass
    });
  } else {
    console.warn('[WEBRTC][ICE_SERVER] No TURN server configured. Connectivity might be limited to STUN (srflx/host).');
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
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const creatingPeers = useRef<Set<string>>(new Set());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const [activeTransmissions, setActiveTransmissions] = useState<Set<string>>(new Set());
  const [micStatus, setMicStatus] = useState<MicStatus>('prompt');

  const initLocalStream = useCallback(async () => {
    if (localStream.current) return localStream.current;
    
    console.log('[WEBRTC][MIC] Initializing audio stream request...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[WEBRTC][MIC] MediaDevices API not available');
      setMicStatus('error');
      return null;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' as any });
          if (status.state === 'denied') {
            setMicStatus('denied');
            return null;
          }
        } catch (e) {
          console.log('[WEBRTC][MIC] Permissions API check skipped');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      console.log('[WEBRTC][MIC] Permission granted');
      
      // Radio silenciada por defecto (PTT OFF)
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
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

  const processPendingCandidates = async (remoteSessionId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidates.current.get(remoteSessionId) || [];
    if (candidates.length > 0 && pc.remoteDescription) {
      console.log(`[WEBRTC][ICE] Processing ${candidates.length} queued candidates for ${remoteSessionId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`[WEBRTC][ICE] Error adding candidate:`, e);
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

    console.log(`[WEBRTC][CREATED] Creating PeerConnection for: ${remoteSessionId}`);
    const pc = new RTCPeerConnection(getIceConfig());

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'webrtc_ice',
          to: remoteSessionId,
          payload: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WEBRTC][STATE] peer=${remoteSessionId} state=${pc.connectionState} ice=${pc.iceConnectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(remoteSessionId);
      }
    };

    pc.ontrack = (event) => {
      console.log(`[AUDIO][ONTRACK] Received remote track from ${remoteSessionId}`);
      let audio = remoteAudios.current.get(remoteSessionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudios.current.set(remoteSessionId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(e => {
        console.warn(`[AUDIO][PLAY] Autoplay check for ${remoteSessionId}`, e.name);
      });
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    peerConnections.current.set(remoteSessionId, pc);
    creatingPeers.current.delete(remoteSessionId);
    return pc;
  }, [sendSignal]);

  const cleanupPeer = (sessionId: string) => {
    console.log(`[WEBRTC][CLEANUP] peer=${sessionId}`);
    const pc = peerConnections.current.get(sessionId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(sessionId);
    }
    pendingCandidates.current.delete(sessionId);
    const audio = remoteAudios.current.get(sessionId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudios.current.delete(sessionId);
    }
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
          if (peerId !== mySessionId && !peerConnections.current.has(peerId)) {
            // Anti-glare: menor ID inicia la oferta
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
        if (pcIce && pcIce.remoteDescription) {
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload))
            .catch(e => console.warn(`[WEBRTC][ICE] Failed to add candidate:`, e));
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
        console.log(`[AUDIO][PTT] My mic is now ${enabled ? 'ON' : 'OFF'}`);
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

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const [id, pc] of peerConnections.current) {
        if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') continue;
        
        try {
          const stats = await pc.getStats();
          stats.forEach(report => {
            if (report.type === 'transport' && report.selectedCandidatePairId) {
              const pair = stats.get(report.selectedCandidatePairId);
              if (pair) {
                const local = stats.get(pair.localCandidateId);
                const remote = stats.get(pair.remoteCandidateId);
                if (local && remote) {
                  console.log(`[WEBRTC][SELECTED_PAIR] peer=${id} local=${local.candidateType} remote=${remote.candidateType} protocol=${local.protocol}`);
                }
              }
            }
          });
        } catch (e) {
          // Stats error ignore
        }
      }
    }, 5000);
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

  return { handleSignal, toggleLocalPTT, activeTransmissions, micStatus, initLocalStream };
}
