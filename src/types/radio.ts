
export type RadioChannel = 
  | 'SUC' | 'POLICIA_NACIONAL' | 'GUARDIA_CIVIL' | 'POLICIA_LOCAL' | 'BOMBEROS' | 'TRANSPORTE'
  | 'CNP_TACTICA_1' | 'CNP_TACTICA_2' | 'CNP_TACTICA_3'
  | 'CNP_GAC_ZETA_10' | 'CNP_GAC_ZETA_20' | 'CNP_GAC_ZETA_25' | 'CNP_GAC_ZETA_30' | 'CNP_GAC_ZETA_35' 
  | 'CNP_GAC_ZETA_45' | 'CNP_GAC_ZETA_50' | 'CNP_GAC_ZETA_55' | 'CNP_GAC_ZETA_60' | 'CNP_GAC_INTERCEPTORA'
  | 'CNP_UPR_FENIX_10' | 'CNP_UPR_FENIX_20' | 'CNP_UPR_FENIX_30'
  | 'CNP_UIP_LOBO_10' | 'CNP_UIP_LOBO_20' | 'CNP_UIP_LOBO_30'
  | 'CNP_GEO_BRAVO_10' | 'CNP_GEO_BRAVO_20';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type MicStatus = 'prompt' | 'granted' | 'denied' | 'error';

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
