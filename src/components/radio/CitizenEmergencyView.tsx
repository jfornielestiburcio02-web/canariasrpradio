
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Phone, Mic, MicOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CitizenEmergencyView({ discordUser }: { discordUser: DiscordUser }) {
  const [isCalling, setIsCalling] = useState(false);
  const channel = 'CIUDADANO_112';

  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    isCalling ? channel : null
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers,
    isCalling ? channel : null
  );

  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: !isCalling });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  const isConnected = status === 'connected';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-lg bg-white border-none shadow-[0_0_50px_rgba(220,38,38,0.2)] rounded-[2.5rem] overflow-hidden relative z-10">
        <div className={cn("h-3 w-full transition-colors duration-500", isCalling ? "bg-red-600 animate-pulse" : "bg-slate-200")} />
        
        <CardHeader className="text-center pt-12 pb-8 px-10">
          <div className="flex justify-center mb-8">
            <div className={cn(
              "p-6 rounded-full transition-all duration-500",
              isCalling ? "bg-red-600 text-white shadow-2xl scale-110" : "bg-slate-100 text-slate-400"
            )}>
              <ShieldAlert className="h-16 w-16" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            Centro de Emergencias
          </CardTitle>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="h-px w-6 bg-slate-200" />
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">112 Canarias</p>
            <span className="h-px w-6 bg-slate-200" />
          </div>
        </CardHeader>

        <CardContent className="px-12 pb-16 space-y-10">
          {!isCalling ? (
            <div className="space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Estás a punto de establecer comunicación con el Centro de Mando 112. 
                  <span className="block mt-2 font-bold text-red-600 uppercase text-[10px] tracking-widest">Uso exclusivo para reportar incidentes</span>
                </p>
              </div>
              <Button 
                onClick={() => setIsCalling(true)}
                className="w-full h-20 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                <Phone className="h-6 w-6" />
                <span className="text-lg font-black uppercase tracking-widest">Establecer Llamada</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100">
                  <Activity className="h-4 w-4 text-red-600 animate-pulse" />
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                    {isConnected ? "Comunicación Activa" : "Conectando..."}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Operadores disponibles: {peers.length}
                </p>
              </div>

              <div className="relative">
                <Button
                  onMouseDown={start}
                  onMouseUp={stop}
                  onMouseLeave={stop}
                  disabled={!isConnected}
                  className={cn(
                    "w-full h-32 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-3",
                    isTransmitting 
                      ? "bg-red-600 shadow-2xl shadow-red-300 scale-95" 
                      : "bg-slate-900 hover:bg-slate-800 shadow-xl"
                  )}
                >
                  {isTransmitting ? (
                    <>
                      <Mic className="h-10 w-10 text-white animate-bounce" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Hablando ahora</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-10 w-10 text-white opacity-40" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Mantener para Hablar</span>
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => setIsCalling(false)}
                className="w-full text-slate-400 hover:text-red-600 hover:bg-transparent text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                Finalizar Llamada
              </Button>
            </div>
          )}

          <div className="pt-4 flex flex-col items-center gap-4 text-center">
            {micStatus === 'denied' && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase">Permiso de micrófono requerido</span>
              </div>
            )}
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.4em]">
              Tenerife RP • Sistema de Comunicaciones Satelital
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
