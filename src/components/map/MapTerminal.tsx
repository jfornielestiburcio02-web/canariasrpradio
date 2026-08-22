
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
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getErlcLogs, getErlcPlayers } from '@/app/actions/erlc';
import { cn } from '@/lib/utils';

export function MapTerminal({ discordUser }: { discordUser: DiscordUser }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
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
      setError(null);
    } else {
      setError(logRes.error);
    }
    
    if (playerRes.success) {
      setPlayers(playerRes.players);
    }
    
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
      const interval = setInterval(fetchData, 15000); // Polling cada 15s para evitar rate limiting
      return () => clearInterval(interval);
    }
  }, [fetchData, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* Historial de Pánicos */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <Card className="flex-1 bg-white border-none shadow-xl rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className={cn("transition-colors p-6", error ? "bg-slate-800" : "bg-red-600")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Bell className={cn("h-6 w-6", !error && "animate-pulse")} />
                  <CardTitle className="text-lg font-black uppercase tracking-widest">
                    {error ? "Enlace de Datos Interrumpido" : "Alertas de Pánico Liberty County"}
                  </CardTitle>
                </div>
                {!error && (
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] uppercase font-black">
                    {logs.length} ACTIVOS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-[400px]">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6">
                  <div className="bg-red-50 p-6 rounded-full">
                    <WifiOff className="h-12 w-12 text-red-500" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-lg font-black text-slate-800 uppercase">Fallo de Autorización API V2</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      El servidor de ERLC ha rechazado la conexión. Esto puede deberse a un Token inválido o a un problema en los servidores de Roblox (Error 1002).
                    </p>
                    <div className="p-4 bg-slate-900 rounded-xl text-[10px] font-mono text-red-400 text-left overflow-auto">
                      RESPUESTA: {error}
                    </div>
                  </div>
                  <Button onClick={fetchData} className="bg-slate-900 uppercase font-black tracking-widest text-[10px] h-12 px-8">
                    Reintentar Conexión
                  </Button>
                </div>
              ) : logs.length > 0 ? (
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
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Esperando señales de pánico...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estado del Servidor */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
            <div className={cn("h-1.5 w-full transition-colors", error ? "bg-red-500" : "bg-emerald-500")} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={cn("h-4 w-4", error ? "text-red-500" : "text-emerald-500")} />
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal API V2</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData} className="h-6 w-6" disabled={loading}>
                  <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-black text-slate-900 uppercase">{error ? "--" : players.length}</div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Sujetos en Liberty County</p>
              </div>
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400 flex items-center gap-2"><Server className="h-3 w-3" /> Server ID:</span>
                  <span className="text-slate-600 font-black">{SERVER_ID}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Estado Enlace:</span>
                  <span className={cn(error ? "text-red-600" : "text-emerald-600 font-black")}>
                    {error ? 'DESCONECTADO' : 'OPERATIVO'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Sincronización:</span>
                  <span className="text-slate-600">
                    {lastUpdate ? lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-500" />
              <h4 className="text-xs font-black uppercase tracking-widest">Protocolo Satelital</h4>
            </div>
            <p className="text-[10px] font-medium leading-relaxed opacity-60 uppercase tracking-tight">
              Monitorización activa del servidor privado. Si un oficial activa el botón de pánico en Roblox, la IA locutará automáticamente la alerta en todas las frecuencias de radio.
            </p>
            <div className="pt-4 flex items-center gap-2">
              <Wifi className={cn("h-3 w-3", !error ? "text-emerald-500" : "text-slate-600")} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {!error ? "Transmisión encriptada activa" : "Enlace satelital caído"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
