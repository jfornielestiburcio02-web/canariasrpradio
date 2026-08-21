'use client';

import { useState, useEffect } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { RadioChannel } from '@/types/radio';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { RadioGrid } from '@/components/radio/RadioGrid';
import { Radio as RadioIcon, Info, LogOut, MicOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RadioClientPageProps {
  discordUser: DiscordUser;
}

export default function RadioClientPage({ discordUser }: RadioClientPageProps) {
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);

  // Hook de WebSocket para señalización
  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    activeChannel
  );

  // Hook de WebRTC para audio
  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus, initLocalStream } = useRadioWebRTC(
    discordUser.id,
    (msg) => send(msg)
  );

  // Hook de PTT (Espacio + Botón)
  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  });

  // Suscribir WebRTC a mensajes de señalización
  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Institucional */}
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
            <span className="text-xs font-bold text-slate-700">{discordUser.global_name || discordUser.username}</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Sesión Activa</span>
          </div>
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
            <Link href="/api/auth/logout"><LogOut className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Alertas de Micrófono */}
        {micStatus === 'denied' && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 animate-in fade-in slide-in-from-top-4">
            <MicOff className="h-4 w-4" />
            <AlertTitle className="text-[11px] font-bold uppercase tracking-wider">Acceso al Micrófono Denegado</AlertTitle>
            <AlertDescription className="text-xs flex items-center justify-between mt-2">
              <span>Debes permitir el uso del micrófono en tu navegador para poder hablar por radio.</span>
              <Button size="sm" variant="outline" className="h-7 text-[9px] font-bold uppercase border-red-200 hover:bg-red-100" onClick={() => window.location.reload()}>
                Recargar Página
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {micStatus === 'error' && (
          <Alert className="bg-orange-50 border-orange-200 border-none shadow-sm">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-[11px] font-bold uppercase tracking-wider text-orange-800">Error de Hardware</AlertTitle>
            <AlertDescription className="text-xs text-orange-700 mt-2 flex items-center justify-between">
              <span>No se ha podido detectar o inicializar el micrófono correctamente.</span>
              <Button size="sm" variant="secondary" className="h-7 text-[9px] font-bold uppercase" onClick={() => initLocalStream()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-2 rounded-lg mt-0.5">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase">Instrucciones de Operación</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sintonice un canal para comenzar. Use <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold">ESPACIO</kbd> para hablar.
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

        {activeTransmissions.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Señal Entrante Activa
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
