
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
  Server,
  Wifi,
  WifiOff,
  User,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';
import { getErlcPlayers } from '@/app/actions/erlc';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MapTerminal({ discordUser }: { discordUser: DiscordUser }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const SERVER_ID = '2534724415';

  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escuchar eventos externos de Firestore en tiempo real
  const eventsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'erlcEvents'), orderBy('timestamp', 'desc'), limit(10));
  }, [db]);

  const { data: events } = useCollection<any>(eventsQuery);

  const fetchData = useCallback(async () => {
    if (!mounted) return;
    setLoading(true);
    const playerRes = await getErlcPlayers();
    
    if (playerRes.success) {
      setPlayers(playerRes.players || []);
      setError(null);
    } else {
      setError(playerRes.error);
    }
    
    setLastUpdate(new Date());
    setLoading(false);
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchData();
      const interval = setInterval(fetchData, 20000); 
      return () => clearInterval(interval);
    }
  }, [fetchData, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50 relative overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lista de Jugadores */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className={cn("transition-colors p-6", error ? "bg-slate-800" : "bg-primary")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Users className="h-6 w-6" />
                  <CardTitle className="text-lg font-black uppercase tracking-widest">
                    {error ? "Enlace Interrumpido" : "Personal en Liberty County"}
                  </CardTitle>
                </div>
                {!error && (
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] uppercase font-black">
                    {players.length} ACTIVOS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {error ? (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <WifiOff className="h-12 w-12 text-red-500" />
                  <div className="max-w-md space-y-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Error de Autenticación V2</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      La API de ER:LC no ha podido validar la sesión. Verifica tu Server Key.
                    </p>
                  </div>
                  <Button onClick={fetchData} className="bg-slate-900 uppercase font-black tracking-widest text-[10px] h-10 px-8">
                    Reintentar
                  </Button>
                </div>
              ) : players.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {players.map((player, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all border-l-4 border-transparent hover:border-primary">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-2.5 rounded-xl">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-800 uppercase leading-none">{player.Player}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{player.Permission}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase text-emerald-600 border-emerald-100">EN LÍNEA</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 space-y-4">
                  <Satellite className="h-12 w-12 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando con satélite...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estado y Eventos Externos */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tarjeta de Estado del Enlace */}
          <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
            <div className={cn("h-1.5 w-full transition-colors", error ? "bg-red-500" : "bg-emerald-500")} />
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={cn("h-4 w-4", error ? "text-red-500" : "text-emerald-500")} />
                  <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado del Enlace</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData} className="h-6 w-6" disabled={loading}>
                  <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Server ID:</span>
                  <span className="text-slate-600 font-black">{SERVER_ID}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">API Status:</span>
                  <span className={cn(error ? "text-red-600" : "text-emerald-600 font-black")}>
                    {error ? 'FALLO V2' : 'OK'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Última Sinc:</span>
                  <span className="text-slate-600">
                    {mounted && lastUpdate ? lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                  </span>
                </div>
            </CardContent>
          </Card>

          {/* Nueva Terminal de Eventos Críticos (Recibe datos del endpoint) */}
          <Card className="bg-slate-900 border-none shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-red-600 h-1.5 w-full animate-pulse" />
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Eventos de Campo</CardTitle>
              </div>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Datos recibidos vía /api/erlc/get_datos</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
                {events && events.length > 0 ? (
                  events.map((event: any) => (
                    <div key={event.id} className="p-4 space-y-2 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase px-2 h-4",
                          event.tipo === 'PANICO' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'
                        )}>
                          {event.tipo}
                        </Badge>
                        <span className="text-[8px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          <Clock className="h-2 w-2" />
                          {event.timestamp ? format(event.timestamp.toDate(), 'HH:mm:ss', { locale: es }) : '--:--:--'}
                        </span>
                      </div>
                      <h4 className="text-[10px] font-black text-white uppercase">{event.sujeto}</h4>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium italic">
                          <MapPin className="h-2.5 w-2.5" /> {event.ubicacion}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">"{event.detalles}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3 opacity-20">
                    <Wifi className="h-10 w-10 text-white mx-auto" />
                    <p className="text-[9px] font-bold text-white uppercase tracking-widest">Esperando telemetría externa...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
