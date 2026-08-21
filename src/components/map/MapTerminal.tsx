
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Crosshair, 
  Navigation, 
  Activity, 
  Satellite, 
  Users, 
  Shield, 
  HeartPulse, 
  Flame,
  Radio,
  Zap
} from 'lucide-react';
import { getErlcPlayers } from '@/app/actions/erlc';
import { cn } from '@/lib/utils';

interface MapTerminalProps {
  discordUser: DiscordUser;
}

export function MapTerminal({ discordUser }: MapTerminalProps) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const result = await getErlcPlayers();
    if (result.success) {
      setPlayers(result.players);
      setError(null);
    } else {
      setError(result.error);
    }
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Polling cada 15 segundos
    return () => clearInterval(interval);
  }, [fetchData]);

  // Clasificar jugadores por equipos
  const policeUnits = players.filter(p => p.Team.includes('Police') || p.Team.includes('Sheriff'));
  const emsUnits = players.filter(p => p.Team.includes('EMS') || p.Team.includes('Fire'));
  const fireUnits = players.filter(p => p.Team.includes('Fire'));
  const civs = players.filter(p => p.Team.includes('Civilian'));

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50 relative">
      {/* Grid de fondo decorativo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {loading && players.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Sincronizando con ERLC API...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 animate-in fade-in duration-1000">
          {/* Visor Principal del Mapa */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                <Activity className={cn("h-4 w-4", error ? "text-red-500" : "text-emerald-500 animate-pulse")} />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {error ? 'Error de Enlace' : 'Liberty County Live'}
                </span>
              </div>
              
              {!error && (
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    Actualizado: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Marcadores decorativos del mapa */}
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              {/* Círculos de radar */}
              <div className="absolute h-96 w-96 border border-slate-200 rounded-full animate-ping opacity-20" />
              <div className="absolute h-[500px] w-[500px] border border-slate-200 rounded-full opacity-10" />
              
              <div className="text-center space-y-6 relative z-10">
                <div className="bg-white p-8 rounded-full shadow-2xl inline-block border border-slate-50">
                   <Navigation className="h-16 w-16 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Sector Central Liberty County</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto">
                    {players.length > 0 
                      ? `${players.length} Almas detectadas en la frecuencia del servidor`
                      : 'Esperando datos de la patrulla aérea'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cruces de puntería */}
            <div className="absolute top-1/2 left-0 w-12 h-[1px] bg-slate-200" />
            <div className="absolute top-1/2 right-0 w-12 h-[1px] bg-slate-200" />
            <div className="absolute top-0 left-1/2 w-[1px] h-12 bg-slate-200" />
            <div className="absolute bottom-0 left-1/2 w-[1px] h-12 bg-slate-200" />
          </div>

          {/* Panel Lateral de Datos */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <Card className="bg-white border-slate-200 rounded-3xl shadow-xl overflow-hidden shrink-0">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado Satelital</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase">Activo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Policía</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">{policeUnits.length}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <HeartPulse className="h-3 w-3 text-red-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">EMS/Fire</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">{emsUnits.length}</div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex items-start gap-3">
                     <div className="bg-primary/10 p-2 rounded-xl"><Users className="h-4 w-4 text-primary" /></div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Población Activa</p>
                       <p className="text-xs font-bold text-slate-700 uppercase mt-0.5">{civs.length} Ciudadanos en zona</p>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Unidades en Servicio */}
            <Card className="flex-1 bg-white border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
              <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-slate-400" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unidades en Frecuencia</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[400px]">
                {players.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {players.filter(p => p.Team !== 'Civilian').map((p, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm",
                            p.Team.includes('Police') ? 'bg-blue-600' : 
                            p.Team.includes('EMS') ? 'bg-red-500' : 
                            p.Team.includes('Fire') ? 'bg-orange-500' : 'bg-slate-400'
                          )}>
                            {p.Team.includes('Police') ? <Shield className="h-4 w-4" /> : 
                             p.Team.includes('EMS') ? <HeartPulse className="h-4 w-4" /> : 
                             p.Team.includes('Fire') ? <Flame className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{p.Name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{p.Team}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[7px] font-bold border-slate-100 text-slate-300 group-hover:text-primary group-hover:border-primary/20">
                          {p.Team.includes('Police') ? 'ADU' : 'SUR'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                    <Zap className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      No se detectan unidades de emergencia activas en el servidor
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
