
export type RadioChannel = 
  | 'COORD_1' | 'COORD_GENERAL'
  | 'SUC' | 'POLICIA_NACIONAL' | 'GUARDIA_CIVIL' | 'POLICIA_LOCAL' | 'BOMBEROS' | 'TRANSPORTE'
  | 'CNP_TACTICA_1' | 'CNP_TACTICA_2' | 'CNP_TACTICA_3'
  | 'CNP_GAC_ZETA_10' | 'CNP_GAC_ZETA_20' | 'CNP_GAC_ZETA_25' | 'CNP_GAC_ZETA_30' | 'CNP_GAC_ZETA_35' 
  | 'CNP_GAC_ZETA_45' | 'CNP_GAC_ZETA_50' | 'CNP_GAC_ZETA_55' | 'CNP_GAC_ZETA_60' | 'CNP_GAC_INTERCEPTORA'
  | 'CNP_UPR_FENIX_10' | 'CNP_UPR_FENIX_20' | 'CNP_UPR_FENIX_30'
  | 'CNP_UIP_LOBO_10' | 'CNP_UIP_LOBO_20' | 'CNP_UIP_LOBO_30'
  | 'CNP_GEO_BRAVO_10' | 'CNP_GEO_BRAVO_20'
  | 'GC_ESP_ASIGN' | 'GC_COS' | 'GC_COTA' | 'GC_M620_JS' | 'GC_M620_A' | 'GC_M620_B' | 'GC_M620_C' | 'GC_M620_D' | 'GC_M620_E'
  | 'GC_M324' | 'GC_M325' | 'GC_M326' | 'GC_M327' | 'GC_PUMA_0' | 'GC_PUMA_10' | 'GC_PUMA_20'
  | 'GC_LOBO_0' | 'GC_LOBO_10' | 'GC_LOBO_20' | 'GC_M680' | 'GC_M681'
  | 'BOM_SIN_ASIGN' | 'BOM_CUB' 
  | 'BOM_BUP_BRAVO_10' | 'BOM_BUP_BRAVO_20' | 'BOM_BUP_BRAVO_30'
  | 'BOM_AEA_ALPHA_10' | 'BOM_AEA_ALPHA_20' | 'BOM_AEA_ALPHA_30'
  | 'BOM_SE_NOVEMBER_10' | 'BOM_SE_NOVEMBER_20' | 'BOM_SE_NOVEMBER_30'
  | 'SUC_SIN_ASIGN' | 'SUC_CCS' | 'SUC_HOSPITAL'
  | 'SUC_SVB_ALPHA_10' | 'SUC_SVB_ALPHA_20' | 'SUC_SVB_ALPHA_30'
  | 'SUC_SVA_BRAVO_10' | 'SUC_SVA_BRAVO_20' | 'SUC_SVA_BRAVO_30'
  | 'SUC_VIR_DELTA_10' | 'SUC_VIR_DELTA_20' | 'SUC_VIR_DELTA_30'
  | 'CAR_COORDINACION' | 'CAR_SIN_ASIGN'
  | 'PL_CANAL_1' | 'PL_CANAL_2' | 'PL_CANAL_3' | 'PL_CANAL_4' | 'PL_COORD' | 'PL_SIN_ASIGN'
  | '112_LINEA_1' | '112_LINEA_2' | '112_LINEA_3';

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
