
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingMessage, PeerStats } from '@/types/radio';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
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
      stream.getAudioTracks().forEach(t => t.enabled = false);
      localStream.current = stream;
      return stream;
    } catch (e) {
      console.error('[WEBRTC] Failed to get mic:', e);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((remoteSessionId: string) => {
    // Si ya existe o se está creando, retornamos la existente o null
    if (peerConnections.current.has(remoteSessionId)) {
      return peerConnections.current.get(remoteSessionId)!;
    }

    if (creatingPeers.current.has(remoteSessionId)) {
      return null;
    }

    creatingPeers.current.add(remoteSessionId);
    console.log(`[WEBRTC][CREATED] Peer: ${remoteSessionId}`);
    
    const pc = new RTCPeerConnection(ICE_CONFIG);

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
      console.log(`[WEBRTC][STATE] ${remoteSessionId}: conn=${pc.connectionState} ice=${pc.iceConnectionState} sig=${pc.signalingState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(remoteSessionId);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const track = event.track;
      
      console.log(`[AUDIO][ONTRACK] From ${remoteSessionId} | Kind: ${track.kind} | Muted: ${track.muted} | Enabled: ${track.enabled} | State: ${track.readyState}`);
      
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
        .then(() => {
          console.log(`[AUDIO][PLAY] Started for ${remoteSessionId} | Paused: ${audio?.paused} | Volume: ${audio?.volume} | ReadyState: ${audio?.readyState}`);
        })
        .catch(e => {
          console.error(`[AUDIO][PLAY] Failed for ${remoteSessionId}:`, e);
        });
    };

    if (localStream.current) {
      console.log(`[WEBRTC][ADD_TRACK] Adding local audio to ${remoteSessionId}`);
      localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
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
          await pcIce.addIceCandidate(new RTCIceCandidate(msg.payload));
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
        console.log(`[AUDIO][PTT_${enabled ? 'START' : 'STOP'}] My mic is now ${enabled ? 'ON' : 'OFF'} | Track State: ${track.readyState}`);
        sendSignal({ type: enabled ? 'ptt_start' : 'ptt_stop' });
      }
    }
  };

  // Monitor de estadísticas y diagnóstico de audio
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const [id, pc] of peerConnections.current) {
        if (pc.connectionState !== 'connected') continue;
        
        const stats = await pc.getStats();
        const audio = remoteAudios.current.get(id);
        const last = lastStats.current.get(id) || { sent: 0, received: 0 };
        
        let outbound: any = null;
        let inbound: any = null;

        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'audio') outbound = report;
          if (report.type === 'inbound-rtp' && report.kind === 'audio') inbound = report;
        });

        if (outbound) {
          const delta = outbound.bytesSent - last.sent;
          console.log(`[WEBRTC][OUTBOUND] peer=${id} bytesSent=${outbound.bytesSent} packetsSent=${outbound.packetsSent} delta=${delta}`);
          last.sent = outbound.bytesSent;
        }

        if (inbound) {
          const delta = inbound.bytesReceived - last.received;
          console.log(`[WEBRTC][INBOUND] peer=${id} bytesReceived=${inbound.bytesReceived} packetsReceived=${inbound.packetsReceived} delta=${delta}`);
          console.log(`[AUDIO][RTP] peer=${id} codec=${inbound.codecId} packetsLost=${inbound.packetsLost} jitter=${inbound.jitter}`);
          last.received = inbound.bytesReceived;
        }

        if (audio) {
          console.log(`[AUDIO][ELEMENT] peer=${id} paused=${audio.paused} muted=${audio.muted} vol=${audio.volume} rs=${audio.readyState} src=${!!audio.srcObject}`);
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
