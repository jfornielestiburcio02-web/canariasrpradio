
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { RadioChannel } from '@/types/radio';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { RadioGrid } from '@/components/radio/RadioGrid';
import { Loader2, Radio as RadioIcon, Info } from 'lucide-react';

export default function RadioPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);

  // Redirección si no hay sesión
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Hook de WebSocket para señalización
  const { connected, peers, send, setOnMessage } = useRadioWebSocket(
    user?.uid || '',
    activeChannel
  );

  // Hook de WebRTC para audio
  const { handleSignal, toggleLocalPTT, activeTransmissions } = useRadioWebRTC(
    user?.uid || '',
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Institucional */}
      <header className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <RadioIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Sistema de Radiocomunicaciones</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenerife RP - Nodo de Emergencias</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-700">{user?.displayName || 'Agente'}</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Autenticado</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner Informativo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-2 rounded-lg mt-0.5">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase">Instrucciones de Operación</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seleccione una radio para entrar en el canal. Mantenga pulsada la tecla <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold">ESPACIO</kbd> o el botón PTT para transmitir. 
              El sistema WebRTC garantiza baja latencia. El micrófono se habilita únicamente durante la transmisión.
            </p>
          </div>
        </div>

        {/* Rejilla de Radios */}
        <RadioGrid 
          activeChannel={activeChannel}
          onJoin={setActiveChannel}
          onLeave={() => setActiveChannel(null)}
          peers={peers}
          connected={connected}
          isTransmitting={isTransmitting}
          onPTTStart={start}
          onPTTStop={stop}
        />

        {/* Indicador de Transmisión Global */}
        {activeTransmissions.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Entrante: {activeTransmissions.size} canal(es) activos
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
