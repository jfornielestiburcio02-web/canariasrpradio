
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneIncoming, Mic, MicOff, Activity, ShieldAlert, Wifi, Headset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { RadioChannel } from '@/types/radio';

export function CoordinatorVoiceHandler({ discordUser }: { discordUser: DiscordUser }) {
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);
  const db = useFirestore();

  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    activeChannel
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  const { handleSignal, toggleMute, activeTransmissions, isMuted } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers,
    activeChannel
  );

  const { toggle } = usePTT(toggleMute, { disabled: !activeChannel });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  useEffect(() => {
    if (db && discordUser.id) {
      setDoc(doc(db, 'users', discordUser.id), {
        radio: {
          canalActual: activeChannel || null,
          isOperator: !!activeChannel,
          isCitizen: false,
          ultimaConexion: serverTimestamp()
        }
      }, { merge: true });
    }
  }, [activeChannel, db, discordUser.id]);

  const isConnected = status === 'connected';

  return (
    <Card className="bg-white border-none shadow-2xl rounded-3xl overflow-hidden h-full flex flex-col">
      <div className={cn("h-2 w-full transition-all", activeTransmissions.size > 0 ? "bg-red-600 animate-pulse" : "bg-slate-200")} />
      <CardHeader className="pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-xl">
              <Headset className={cn("h-5 w-5", activeChannel ? "text-red-600" : "text-slate-400")} />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Despacho 112 (Voz Abierta)</CardTitle>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "text-[9px] font-black uppercase",
            isConnected ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
          )}>
            {isConnected ? "CANAL ONLINE" : "DESCONECTADO"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Atender Línea</label>
            <Select value={activeChannel || ""} onValueChange={(v) => setActiveChannel(v as RadioChannel)}>
              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold uppercase">
                <SelectValue placeholder="ELEGIR LÍNEA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="112_LINEA_1">LÍNEA DE EMERGENCIA 1</SelectItem>
                <SelectItem value="112_LINEA_2">LÍNEA DE EMERGENCIA 2</SelectItem>
                <SelectItem value="112_LINEA_3">LÍNEA DE EMERGENCIA 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Línea</p>
              <p className="text-2xl font-black text-slate-900">{activeChannel ? peers.length : '--'}</p>
            </div>
            {activeTransmissions.size > 0 && (
              <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-2 rounded-xl animate-pulse">
                <Activity className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ciudadano Hablando</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={toggle}
            disabled={!isConnected || !activeChannel}
            className={cn(
              "w-full h-24 text-sm font-black uppercase tracking-[0.3em] transition-all rounded-3xl",
              !isMuted 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200" 
                : activeChannel ? "bg-slate-900 hover:bg-slate-800 shadow-lg" : "bg-slate-100 text-slate-300"
            )}
          >
            {!isMuted ? (
              <div className="flex items-center gap-3">
                <Mic className="h-6 w-6 animate-pulse" /> VOZ ABIERTA ACTIVA
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <MicOff className="h-6 w-6 opacity-40" /> MICRÓFONO SILENCIADO
              </div>
            )}
          </Button>
          <div className="text-center">
            {activeChannel && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveChannel(null)}
                className="text-[8px] font-black text-red-500 uppercase hover:bg-red-50 h-6"
              >
                Cerrar Línea
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
