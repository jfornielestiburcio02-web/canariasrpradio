
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Users, Wifi, WifiOff, AlertCircle, ShieldOff, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RadioCardProps {
  channel: RadioChannel;
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onJoin: () => void;
  onLeave: () => void;
  users: any[]; 
  wsStatus: WSStatus;
  isTransmitting: boolean;
  onPTTStart: () => void;
  onPTTStop: () => void;
  onPTTToggle: () => void;
  isMobile: boolean;
  isAdmin?: boolean;
  onKick?: (userId: string) => void;
  currentUserId?: string;
}

export function RadioCard({
  channel,
  title,
  icon,
  active,
  onJoin,
  onLeave,
  users,
  wsStatus,
  isTransmitting,
  onPTTStart,
  onPTTStop,
  onPTTToggle,
  isMobile,
  isAdmin = false,
  onKick,
  currentUserId
}: RadioCardProps) {
  const isConnected = wsStatus === 'connected';
  const isConnecting = wsStatus === 'connecting';
  const isError = wsStatus === 'error';

  return (
    <Card className={cn(
      "h-full relative overflow-hidden transition-all duration-300 rounded-[2.5rem] border-none shadow-2xl flex flex-col bg-white",
      active ? "ring-4 ring-primary/10" : "opacity-80"
    )}>
      <div className={cn(
        "h-3 w-full",
        active ? (isTransmitting ? "bg-red-500 animate-pulse" : isError ? "bg-destructive" : isConnected ? "bg-primary" : "bg-orange-400 animate-pulse") : "bg-slate-200"
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between p-8 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-4 rounded-[1.5rem] shadow-xl",
            active ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
          )}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">{title}</CardTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sintonización Institucional</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge 
            variant={active ? (isConnected ? "default" : isError ? "destructive" : "secondary") : "outline"} 
            className="text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full"
          >
            {isConnected ? "SISTEMA ONLINE" : isConnecting ? "SINCRONIZANDO..." : isError ? "FALLO DE RED" : "EN ESPERA"}
          </Badge>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {isConnected ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-slate-300" />}
            {isConnected ? "Señal Cifrada" : "Sin Cobertura"}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-8 pt-4 flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Panel Izquierdo: Usuarios y Estado */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal en frecuencia</h4>
              </div>
              <Badge className="bg-slate-200 text-slate-600 text-[10px] font-black rounded-full border-none">
                {users.length} ACTIVOS
              </Badge>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {users.length > 0 ? users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-primary/20 group/agent">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-1 ring-slate-100">
                          <AvatarImage src={u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : undefined} />
                          <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-600">
                            {u.username?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {u.radio?.isTransmitting && (
                          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white animate-pulse">
                            <Mic className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{u.username}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          Placa: {u.radio?.placa || 'SIN ASIGNAR'}
                        </span>
                      </div>
                    </div>
                    
                    {isAdmin && u.id !== currentUserId && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/agent:opacity-100 transition-all rounded-xl"
                        onClick={() => onKick?.(u.id)}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )) : (
                  <div className="h-40 flex flex-col items-center justify-center opacity-30">
                    <Radio className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Canal despejado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Advertencia de Seguridad */}
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-red-700/70 uppercase leading-relaxed">
              ATENCIÓN: TRANSMISIÓN CIFRADA PUNTO A PUNTO. EL USO INDEBIDO SERÁ REGISTRADO POR LA JEFATURA.
            </p>
          </div>
        </div>

        {/* Panel Derecho: Controles PTT */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <Button
            onMouseDown={!isMobile ? onPTTStart : undefined}
            onMouseUp={!isMobile ? onPTTStop : undefined}
            onMouseLeave={!isMobile ? onPTTStop : undefined}
            onClick={isMobile ? onPTTToggle : undefined}
            disabled={!isConnected}
            className={cn(
              "w-full flex-1 min-h-[200px] rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] transition-all duration-300 flex flex-col gap-6 items-center justify-center border-b-8 active:border-b-0 active:translate-y-2",
              isTransmitting 
                ? "bg-red-600 border-red-800 text-white shadow-2xl shadow-red-200" 
                : isConnected 
                  ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {isTransmitting ? (
              <>
                <div className="bg-white/20 p-6 rounded-full animate-bounce">
                  <Mic className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="block text-lg">EN AIRE</span>
                  <span className="text-[8px] opacity-60 tracking-[0.5em]">CANAL {channel.split('_').pop()}</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/10 p-6 rounded-full opacity-40">
                  <MicOff className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="block text-lg">PULSAR PTT</span>
                  <span className="text-[8px] opacity-60 tracking-[0.5em]">
                    {isMobile ? 'TOCAR PARA ACTIVAR' : 'MANTENER TECLA'}
                  </span>
                </div>
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
            onClick={onLeave}
          >
            Finalizar Servicio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
