
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { RadioChannel } from '@/types/radio';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { RadioGrid } from '@/components/radio/RadioGrid';
import { Radio as RadioIcon, Info, LogOut, MicOff, Users, Shield, BadgeCheck, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RadioClientPageProps {
  discordUser: DiscordUser;
}

export default function RadioClientPage({ discordUser }: RadioClientPageProps) {
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);
  const [isEditingPlaca, setIsEditingPlaca] = useState(false);
  const [placaInput, setPlacaInput] = useState('');
  
  const db = useFirestore();

  // Estabilizar la referencia al documento del usuario
  const userRef = useMemoFirebase(() => {
    if (!db || !discordUser.id) return null;
    return doc(db, 'users', discordUser.id);
  }, [db, discordUser.id]);

  const { data: userData } = useDoc<any>(userRef);

  // Sincronizar estado en Firestore al cambiar de canal (solo cuando cambia el canal)
  useEffect(() => {
    if (db && discordUser.id) {
      setDoc(doc(db, 'users', discordUser.id), {
        radio: {
          canalActual: activeChannel || null,
          ultimaConexion: serverTimestamp()
        }
      }, { merge: true });
    }
  }, [activeChannel, db, discordUser.id]);

  const handleSavePlaca = async () => {
    if (db && discordUser.id) {
      await setDoc(doc(db, 'users', discordUser.id), {
        radio: { placa: placaInput }
      }, { merge: true });
      setIsEditingPlaca(false);
    }
  };

  useEffect(() => {
    if (userData?.radio?.placa) {
      setPlacaInput(userData.radio.placa);
    }
  }, [userData?.radio?.placa]);

  // Hook de WebSocket para señalización
  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    activeChannel
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  // Pasamos 'peers' al hook de WebRTC para que gestione las limpiezas de malla
  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers
  );

  // Hook de PTT con bloqueo si no hay canal
  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: !activeChannel });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  // Consulta de usuarios en el mismo canal
  const activeUsersQuery = useMemoFirebase(() => {
    if (!db || !activeChannel) return null;
    return query(
      collection(db, 'users'),
      where('radio.canalActual', '==', activeChannel)
    );
  }, [db, activeChannel]);

  const { data: channelUsers } = useCollection<any>(activeUsersQuery);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <RadioIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">Radio Comunicaciones</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tenerife RP - Servicios de Emergencia</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{discordUser.global_name || discordUser.username}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isEditingPlaca ? (
                <div className="flex items-center gap-1">
                  <Input 
                    value={placaInput} 
                    onChange={(e) => setPlacaInput(e.target.value)}
                    className="h-5 w-20 text-[9px] font-bold px-1 py-0 uppercase"
                    autoFocus
                  />
                  <Button size="icon" className="h-5 w-5" onClick={handleSavePlaca}>OK</Button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingPlaca(true)}
                  className="text-[9px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-tighter"
                >
                  <Shield className="h-3 w-3" />
                  Placa: {userData?.radio?.placa || 'SIN ASIGNAR'}
                  <Pencil className="h-2 w-2" />
                </button>
              )}
            </div>
          </div>
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
            <Link href="/api/auth/logout"><LogOut className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-3 space-y-8">
          {micStatus === 'denied' && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <MicOff className="h-4 w-4" />
              <AlertTitle className="text-[11px] font-bold uppercase tracking-wider">Acceso al Micrófono Denegado</AlertTitle>
              <AlertDescription className="text-xs mt-2">
                Debes permitir el uso del micrófono para operar.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase">Estado Operativo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {activeChannel 
                  ? `Sintonizado en ${activeChannel}. Mantén pulsado ESPACIO para transmitir.` 
                  : 'Selecciona un canal de la cuadrícula para entrar en servicio.'}
              </p>
            </div>
          </div>

          <RadioGrid 
            activeChannel={activeChannel}
            onJoin={setActiveChannel}
            onLeave={() => setActiveChannel(null)}
            peers={peers}
            wsStatus={status}
            isTransmitting={isTransmitting}
            onPTTStart={start}
            onPTTStop={stop}
          />
        </div>

        {/* Panel Lateral de Usuarios en Canal */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Personal en Canal
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-4 space-y-3">
              {activeChannel ? (
                channelUsers && channelUsers.length > 0 ? (
                  channelUsers.map((u: any) => (
                    <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      activeTransmissions.has(u.id) ? 'bg-red-50 border-red-200 ring-1 ring-red-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`h-1.5 w-1.5 rounded-full ${activeTransmissions.has(u.id) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-700 truncate uppercase">
                            {u.radio?.placa ? `[${u.radio.placa}] ` : ''}{u.username}
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-tighter ${
                            activeTransmissions.has(u.id) ? 'text-red-500 animate-pulse' : 'text-slate-400'
                          }`}>
                            {activeTransmissions.has(u.id) ? 'Transmitiendo...' : 'A la escucha'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] font-bold text-slate-400 text-center py-4 uppercase italic">Sincronizando personal...</p>
                )
              ) : (
                <div className="text-center py-8 space-y-2 opacity-50">
                  <RadioIcon className="h-8 w-8 text-slate-200 mx-auto" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Sin canal activo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {activeTransmissions.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 z-50 ring-2 ring-red-400/50">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Transmisión en curso: {activeTransmissions.size} {activeTransmissions.size === 1 ? 'Agente' : 'Agentes'}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
