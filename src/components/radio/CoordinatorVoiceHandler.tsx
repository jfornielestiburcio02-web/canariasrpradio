
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PhoneIncoming, Mic, MicOff, Activity, ShieldAlert, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CoordinatorVoiceHandler({ discordUser }: { discordUser: DiscordUser }) {
  const channel = 'CIUDADANO_112';
  
  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    channel
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers,
    channel
  );

  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: false });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  const isConnected = status === 'connected';

  return (
    <Card className="bg-white border-none shadow-2xl rounded-3xl overflow-hidden">
      <div className={cn("h-2 w-full", activeTransmissions.size > 0 ? "bg-red-600 animate-pulse" : "bg-slate-200")} />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-xl">
              <PhoneIncoming className={cn("h-5 w-5", activeTransmissions.size > 0 ? "text-red-600 animate-bounce" : "text-slate-400")} />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Canal de Emergencias</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Línea directa con ciudadanos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "text-[9px] font-black uppercase",
              isConnected ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
              {isConnected ? "En línea" : "Desconectado"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ciudadanos en Línea</p>
            <p className="text-2xl font-black text-slate-900">{Math.max(0, peers.length)}</p>
          </div>
          <div className="flex gap-2">
            {activeTransmissions.size > 0 ? (
              <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-2">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recibiendo Audio</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-200 text-slate-400 px-4 py-2 rounded-xl">
                <Wifi className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Silencio Operativo</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            disabled={!isConnected}
            className={cn(
              "w-full h-20 text-sm font-black uppercase tracking-[0.3em] transition-all rounded-2xl",
              isTransmitting 
                ? "bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200" 
                : "bg-slate-900 hover:bg-slate-800 shadow-lg"
            )}
          >
            {isTransmitting ? (
              <div className="flex items-center gap-3">
                <Mic className="h-6 w-6 animate-bounce" /> TRANSMITIENDO A CIUDADANOS
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <MicOff className="h-6 w-6 opacity-40" /> PULSAR PARA RESPONDER
              </div>
            )}
          </Button>
          <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Los ciudadanos solo pueden escucharte cuando mantienes el botón pulsado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
