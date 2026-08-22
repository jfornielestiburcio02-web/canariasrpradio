
export type RadioChannel = string;

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type MicStatus = 'prompt' | 'granted' | 'denied' | 'error';

export interface RadioUser {
  id: string;
  username: string;
  avatar?: string;
  isTransmitting: boolean;
  sessionId: string;
  radio?: {
    placa?: string;
  };
}

export interface SignalingMessage {
  type: 'join_channel' | 'leave_channel' | 'channel_peers_update' | 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice' | 'ptt_start' | 'ptt_stop' | 'force_leave';
  payload: any;
  from?: string;
  to?: string;
  channel?: RadioChannel;
}
