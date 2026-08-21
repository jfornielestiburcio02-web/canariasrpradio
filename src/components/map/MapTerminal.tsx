'use client';

import { useState, useEffect } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Crosshair, Navigation, Activity, Satellite } from 'lucide-react';

interface MapTerminalProps {
  discordUser: DiscordUser;
}

export function MapTerminal({ discordUser }: MapTerminalProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de activos de ERLC
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 relative">
      {/* Grid de fondo decorativo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Inicializando Enlace ERLC...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 animate-in fade-in duration-1000">
          {/* Visor Principal del Mapa */}
          <div className="flex-1 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-6 left-6 flex gap-4 z-20">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Feed Directo</span>
              </div>
            </div>

            {/* Placeholder del Mapa de Liberty County */}
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <div className="relative w-full h-full opacity-40 mix-blend-overlay">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f644_0,transparent_70%)]" />
              </div>
              <div className="text-center space-y-4">
                <Navigation className="h-16 w-16 text-slate-700 mx-auto animate-bounce" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] max-w-xs leading-relaxed">
                  Esperando Coordenadas del Servidor ERLC
                </p>
              </div>
            </div>

            {/* Cruces de puntería decorativas */}
            <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-white/20" />
            <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-white/20" />
            <div className="absolute top-0 left-1/2 w-[1px] h-8 bg-white/20" />
            <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-white/20" />
          </div>

          {/* Panel Lateral de Datos */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <Card className="bg-slate-900/50 border-white/10 text-white rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="h-1 bg-primary w-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado Satelital</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Señal</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase">Óptima</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[92%]" />
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                     <div className="bg-primary/10 p-2 rounded-lg"><Crosshair className="h-4 w-4 text-primary" /></div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-500 uppercase">Sector Asignado</p>
                       <p className="text-xs font-bold text-white uppercase mt-0.5">Liberty County Central</p>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 bg-black/20 rounded-3xl border border-white/5 p-6 flex flex-col justify-center text-center space-y-4">
               <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] leading-relaxed">
                 Pásame los datos de la API de ERLC para conectar las unidades en tiempo real.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
