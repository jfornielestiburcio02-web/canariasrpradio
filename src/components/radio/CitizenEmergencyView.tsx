
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Activity, Phone, Mic, MicOff, AlertCircle, ShieldAlert, Wifi, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { RadioChannel } from '@/types/radio';

export function CitizenEmergencyView({ discordUser }: { discordUser: DiscordUser }) {
  const [selectedChannel, setSelectedChannel] = useState<RadioChannel | null>(null);
  const db = useFirestore();

  // Monitorear ocupación de canales 112
  const channelsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'users'),
      where('radio.canalActual', 'in', ['112_LINEA_1', '112_LINEA_2', '112_LINEA_3'])
    );
  }, [db]);

  const { data: usersIn112 } = useCollection<any>(channelsQuery);

  // Lógica de WebSocket y WebRTC para el canal seleccionado
  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    selectedChannel
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers,
    selectedChannel
  );

  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: !selectedChannel });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  // Actualizar estado en Firestore al entrar/salir
  useEffect(() => {
    if (db && discordUser.id) {
      setDoc(doc(db, 'users', discordUser.id), {
        username: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
        radio: {
          canalActual: selectedChannel,
          isCitizen: !!selectedChannel,
          ultimaConexion: serverTimestamp()
        }
      }, { merge: true });
    }
  }, [selectedChannel, db, discordUser]);

  const getLineStatus = (channel: string) => {
    const occupants = usersIn112.filter(u => u.radio?.canalActual === channel);
    const operators = occupants.filter(u => u.radio?.isOperator);
    const citizens = occupants.filter(u => u.radio?.isCitizen);
    
    const isFull = operators.length >= 1 && citizens.length >= 1;
    const hasOperator = operators.length > 0;
    
    return { occupants, operators, citizens, isFull, hasOperator };
  };

  const lines = [
    { id: '112_LINEA_1', name: 'Línea de Emergencia 1' },
    { id: '112_LINEA_2', name: 'Línea de Emergencia 2' },
    { id: '112_LINEA_3', name: 'Línea de Emergencia 3' },
  ];

  const isConnected = status === 'connected';

  if (selectedChannel) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[150px]" />
        </div>

        <Card className="w-full max-w-lg bg-white border-none shadow-[0_0_50px_rgba(220,38,38,0.2)] rounded-[2.5rem] overflow-hidden relative z-10">
          <div className="h-3 w-full bg-red-600 animate-pulse" />
          <CardHeader className="text-center pt-12 pb-8 px-10">
            <div className="flex justify-center mb-8">
              <div className="p-6 rounded-full bg-red-600 text-white shadow-2xl scale-110">
                <Activity className="h-16 w-16" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Comunicación Activa</CardTitle>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mt-4">Línea: {selectedChannel.replace('_', ' ')}</p>
          </CardHeader>
          <CardContent className="px-12 pb-16 space-y-10">
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100">
                  <Wifi className="h-4 w-4 text-red-600 animate-pulse" />
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                    {isConnected ? "Enlace Establecido" : "Sincronizando..."}
                  </span>
                </div>
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
                onClick={() => setSelectedChannel(null)}
                className="w-full text-slate-400 hover:text-red-600 hover:bg-transparent text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                Finalizar Llamada
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="bg-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-red-600/20">
            <ShieldAlert className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Centro de Emergencias 112</h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.3em]">Servicio de Ayuda al Ciudadano - Tenerife RP</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lines.map((line) => {
            const { isFull, hasOperator, operators } = getLineStatus(line.id);
            const operator = operators[0];

            return (
              <Card key={line.id} className={cn(
                "bg-white border-none shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-300",
                isFull ? "opacity-60 grayscale pointer-events-none" : "hover:scale-[1.02]"
              )}>
                <div className={cn("h-2 w-full", isFull ? "bg-slate-300" : hasOperator ? "bg-emerald-500" : "bg-red-500")} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{line.name}</CardTitle>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-bold uppercase",
                      isFull ? "border-slate-200 text-slate-400" : hasOperator ? "border-emerald-200 text-emerald-600" : "border-red-200 text-red-600"
                    )}>
                      {isFull ? "LÍNEA OCUPADA" : hasOperator ? "OPERADOR LISTO" : "ESPERANDO OP."}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {hasOperator ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={operator.avatar ? `https://cdn.discordapp.com/avatars/${operator.id}/${operator.avatar}.png` : undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-600 text-[10px] font-bold">112</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-emerald-700 uppercase truncate">{operator.username}</span>
                        <span className="text-[8px] font-bold text-emerald-500 uppercase">Operador en línea</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 italic text-[10px] text-slate-400 font-medium">
                      Buscando operadores disponibles...
                    </div>
                  )}

                  <Button 
                    onClick={() => setSelectedChannel(line.id as RadioChannel)}
                    disabled={isFull}
                    className={cn(
                      "w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg",
                      isFull ? "bg-slate-200" : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <Phone className="h-4 w-4 mr-2" /> Entrar en Llamada
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] leading-relaxed">
            AVISO: EL USO INDEBIDO O FALSO DE ESTA LÍNEA ES MOTIVO DE SANCIÓN DISCIPLINARIA GRAVE POR PARTE DE LA MODERACIÓN.
          </p>
        </div>
      </div>
    </div>
  );
}
