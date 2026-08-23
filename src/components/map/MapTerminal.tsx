
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Activity, 
  Satellite, 
  AlertTriangle, 
  MapPin,
  Maximize2,
  Navigation,
  Shield,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import Image from 'next/image';

// --- CONFIGURACIÓN DE CALIBRACIÓN SOLICITADA ---
const ANCHO_PNG = 1024;
const ALTO_PNG = 1024;
const ROBLOX_X_MIN = -2200;
const ROBLOX_X_MAX = 2200;
const ROBLOX_Z_MIN = -2200;
const ROBLOX_Z_MAX = 2200;

function calibrarCoordenadas(robloxX: number, robloxZ: number) {
  const porcentajeX = (robloxX - ROBLOX_X_MIN) / (ROBLOX_X_MAX - ROBLOX_X_MIN);
  const porcentajeZ = (robloxZ - ROBLOX_Z_MIN) / (ROBLOX_Z_MAX - ROBLOX_Z_MIN);

  const pixelX = porcentajeX * ANCHO_PNG;
  const pixelY = ALTO_PNG - (porcentajeZ * ALTO_PNG); // Inversión solicitada

  return {
    x: Math.min(Math.max(Math.round(pixelX), 0), ANCHO_PNG),
    y: Math.min(Math.max(Math.round(pixelY), 0), ALTO_PNG)
  };
}

export function MapTerminal({ discordUser }: { discordUser: DiscordUser }) {
  const db = useFirestore();
  const [zoom, setZoom] = useState(1);

  // Consultar posiciones de jugadores en tiempo real
  const positionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'playerPositions');
  }, [db]);
  const { data: positions } = useCollection<any>(positionsQuery);

  // Consultar pánicos recientes (últimos 10 minutos)
  const panicsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'erlcEvents'),
      where('tipo', 'in', ['PANICO', 'PANICBUTTON', 'PANIC BUTTON']),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [db]);
  const { data: panics } = useCollection<any>(panicsQuery);

  const MAP_URL = "https://static.wikia.nocookie.net/emergency-response-liberty-county/images/c/c5/Map_of_ERLC.png/revision/latest?cb=20241122010502";

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      {/* HUD Superior */}
      <div className="absolute top-6 left-6 z-20 space-y-4 w-72">
        <Card className="bg-slate-900/80 backdrop-blur-md border-slate-800 shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4 text-primary animate-pulse" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white">Enlace Satelital</CardTitle>
              </div>
              <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-500 font-black">ACTIVO</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Unidades en campo</span>
              <span className="text-xs font-black text-white">{positions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Alertas Activas</span>
              <span className={cn("text-xs font-black", panics.length > 0 ? "text-red-500" : "text-slate-600")}>
                {panics.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {panics.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest px-1">Amenazas Detectadas</p>
            {panics.map((panic: any) => (
              <div key={panic.id} className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-white uppercase truncate">{panic.sujeto}</p>
                  <p className="text-[8px] font-medium text-red-400/70 uppercase truncate">{panic.ubicacion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controles de Mapa */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(prev => Math.min(prev + 0.5, 3))}
          className="h-10 w-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
          className="h-10 w-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl"
        >
          -
        </button>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 overflow-hidden cursor-crosshair relative">
        <div 
          className="transition-transform duration-500 ease-out origin-center absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="relative w-[1024px] h-[1024px] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <Image 
              src={MAP_URL} 
              alt="ERLC Map" 
              width={1024} 
              height={1024}
              className="opacity-90 grayscale brightness-75 hover:grayscale-0 transition-all duration-700"
              priority
              unoptimized
            />
            
            {/* Capa de Cuadrícula Táctica */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '64px 64px'
            }} />

            {/* Marcadores de Jugadores */}
            {positions.map((pos: any) => {
              const coords = calibrarCoordenadas(pos.x, pos.z);
              return (
                <div 
                  key={pos.id} 
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                  style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
                >
                  <div className="relative">
                    <div className="h-3 w-3 bg-primary rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-in zoom-in duration-300" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-all">
                      {pos.playerName}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Marcadores de Pánico */}
            {panics.map((panic: any) => {
              if (panic.x === null || panic.z === null) return null;
              const coords = calibrarCoordenadas(panic.x, panic.z);
              return (
                <div 
                  key={panic.id} 
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-20 w-20 bg-red-600/30 rounded-full animate-ping" />
                    <div className="absolute h-10 w-10 bg-red-600/40 rounded-full animate-pulse" />
                    <AlertTriangle className="h-6 w-6 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-xl whitespace-nowrap">
                      PÁNICO: {panic.sujeto}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Leyenda */}
      <div className="absolute bottom-8 left-8 z-20 flex gap-6 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <Circle className="h-2 w-2 fill-primary text-primary" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unidad Activa</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alerta de Pánico</span>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-3 w-3 text-slate-600" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Eje Central (0,0)</span>
        </div>
      </div>
    </div>
  );
}
