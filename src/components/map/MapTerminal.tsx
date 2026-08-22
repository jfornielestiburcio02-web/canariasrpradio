
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Activity, 
  Satellite, 
  Users, 
  Shield, 
  RefreshCw,
  AlertTriangle,
  Bell,
  Clock,
  MapPin,
  Server
} from 'lucide-react';
import { getErlcLogs, getErlcPlayers } from '@/app/actions/erlc';
import { cn } from '@/lib/utils';

export function MapTerminal({ discordUser }: { discordUser: DiscordUser }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const SERVER_ID = '2534724415';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [logRes, playerRes] = await Promise.all([getErlcLogs(), getErlcPlayers()]);
    
    if (logRes.success) {
      setLogs(logRes.logs.filter((l: any) => l.Log.toLowerCase().includes('panic button')));
    }
    
    if (playerRes.success) {
      setPlayers(playerRes.players);
    }
    
    if (!logRes.success || !playerRes.success) {
      setError(logRes.error || playerRes.error || 'Fallo de conexión satelital');
    } else {
      setError(null);
    }
    
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Evitar error de hidratación devolviendo un esqueleto o nada hasta que el cliente esté listo
  if (!mounted) return null;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* Historial de Pánicos */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <Card className="flex-1 bg-white border-none shadow-xl rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-red-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 animate-pulse" />
                  <CardTitle className="text-lg font-black uppercase tracking-widest">Alertas de Pánico Recientes</CardTitle>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] uppercase font-black">{logs.length} ACTIVOS</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {logs.map((log, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-red-50/30 transition-all border-l-4 border-transparent hover:border-red-600">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-100 p-3 rounded-2xl">
                          <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{log.Log.split(' has')[0]}</h3>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-bold uppercase">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {log.Log.match(/at\s+(.+)$/i)?.[1] || 'Ubicación Desconocida'}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(log.Timestamp * 1000).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-red-600 text-white text-[9px] font-black uppercase">CRÍTICO</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30 space-y-4">
                  <Satellite className="h-16 w-16 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin alertas críticas en el sector</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estado del Servidor */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
            <div className="h-1.5 bg-slate-900 w-full" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={cn("h-4 w-4", error ? "text-red-500" : "text-emerald-500")} />
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enlace Satelital</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData} className="h-6 w-6"><RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-black text-slate-900 uppercase">{players.length}</div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Sujetos Detectados</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400 flex items-center gap-2"><Server className="h-3 w-3" /> Server ID:</span>
                  <span className="text-slate-600">{SERVER_ID}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Estado API:</span>
                  <span className={cn(error ? "text-red-500" : "text-emerald-500")}>{error ? 'FALLO' : 'ACTIVO'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Sincronización:</span>
                  <span className="text-slate-600">{lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h4 className="text-xs font-black uppercase tracking-widest">Protocolo de Pánico</h4>
            </div>
            <p className="text-[10px] font-medium leading-relaxed opacity-60 uppercase">
              El sistema monitoriza el servidor <b>{SERVER_ID}</b>. Si un oficial activa el pánico, se activará la locución IA en todas las radios.
            </p>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-[9px] text-red-400 font-bold uppercase leading-tight">Error: {error}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
