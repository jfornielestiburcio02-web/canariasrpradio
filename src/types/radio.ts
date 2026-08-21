
export type RadioChannel = 'SUC' | 'POLICIA_NACIONAL' | 'GUARDIA_CIVIL' | 'POLICIA_LOCAL' | 'BOMBEROS' | 'TRANSPORTE';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RadioUser {
  id: string;
  username: string;
  avatar?: string;
  isTransmitting: boolean;
  sessionId: string;
}

export interface SignalingMessage {
  type: 'join_channel' | 'leave_channel' | 'channel_peers_update' | 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice' | 'ptt_start' | 'ptt_stop';
  payload: any;
  from?: string;
  to?: string;
  channel?: RadioChannel;
}

export interface PeerStats {
  bytesSent: number;
  packetsSent: number;
  bytesReceived: number;
  packetsReceived: number;
  packetsLost?: number;
  jitter?: number;
  codec?: string;
  ssrc?: number;
}
