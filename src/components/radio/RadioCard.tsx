
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Users, Wifi, WifiOff, AlertCircle, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadioCardProps {
  channel: RadioChannel;
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onJoin: () => void;
  onLeave: () => void;
  users: string[];
  wsStatus: WSStatus;
  isTransmitting: boolean;
  onPTTStart: () => void;
  onPTTStop: () => void;
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
  onPTTStop
}: RadioCardProps) {
  const isConnected = wsStatus === 'connected';
  const isConnecting = wsStatus === 'connecting';
  const isError = wsStatus === 'error';

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      active ? "border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02]" : "border-slate-200 opacity-80 hover:opacity-100"
    )}>
      <div className={cn(
        "h-1.5 w-full",
        active ? (isTransmitting ? "bg-red-500 animate-pulse" : isError ? "bg-destructive" : isConnected ? "bg-primary" : "bg-orange-400 animate-pulse") : "bg-slate-200"
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
          )}>
            {icon}
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">{title}</CardTitle>
        </div>
        <Badge 
          variant={active ? (isConnected ? "default" : isError ? "destructive" : "secondary") : "outline"} 
          className="text-[9px]"
        >
          {!active ? "DISPONIBLE" : isConnected ? "CONECTADO" : isConnecting ? "CONECTANDO..." : isError ? "ERROR RED" : "SIN CONEXIÓN"}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{active ? users.length : 0} usuarios</span>
          </div>
          {active && (
            <div className="flex items-center gap-1.5">
              {isConnected ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : isError ? <AlertCircle className="h-3.5 w-3.5 text-destructive" /> : <WifiOff className="h-3.5 w-3.5 text-slate-300" />}
              <span>{isConnected ? "Señal OK" : isError ? "Error" : "Buscando..."}</span>
            </div>
          )}
        </div>

        {!active ? (
          <Button 
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-[0.2em]"
            onClick={onJoin}
          >
            Sintonizar
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              onMouseDown={onPTTStart}
              onMouseUp={onPTTStop}
              onMouseLeave={onPTTStop}
              disabled={!isConnected}
              className={cn(
                "w-full h-14 text-sm font-bold uppercase tracking-[0.3em] transition-all",
                isTransmitting 
                  ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 scale-[0.98]" 
                  : isConnected ? "bg-primary hover:bg-primary/90" : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {!isConnected ? (
                <div className="flex items-center gap-2">
                  <ShieldOff className="h-5 w-5 opacity-50" /> BLOQUEADO
                </div>
              ) : isTransmitting ? (
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 animate-bounce" /> TRANSMITIENDO
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MicOff className="h-5 w-5 opacity-50" /> PTT
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors"
              onClick={onLeave}
            >
              Cerrar Canal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
