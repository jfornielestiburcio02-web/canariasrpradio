'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { RadioChannel } from '@/types/radio';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { RadioGrid } from '@/components/radio/RadioGrid';
import { Radio as RadioIcon, Info, LogOut, MicOff, Users, Shield, BadgeCheck, Pencil, Bell, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { EmergencyCallList } from './EmergencyCallList';
import { generateEmergencyAudio } from '@/ai/flows/tts-emergency-flow';
import { getErlcLogs } from '@/app/actions/erlc';

interface RadioClientPageProps {
  discordUser: DiscordUser;
  is112?: boolean;
}

export default function RadioClientPage({ discordUser, is112 = false }: RadioClientPageProps) {
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);
  const [isEditingPlaca, setIsEditingPlaca] = useState(false);
  const [placaInput, setPlacaInput] = useState('');
  const pathname = usePathname();
  const lastProcessedPanicRef = useRef<number>(0);
  
  const db = useFirestore();

  // --- Sistema de Audio Institucional + Pánico ERLC ---
  useEffect(() => {
    if (!db) return;

    const introSoundUrl = "https://res.cloudinary.com/dgvh0c87y/video/upload/v1787391237/1514375003628376116_phw9ti.ogg";
    const outroSoundUrl = "https://res.cloudinary.com/dgvh0c87y/video/upload/v1787391249/radio_finalizar_invertido_aiifyo.ogg";
    const panicSoundUrl = "https://www.myinstants.com/media/sounds/panic-button.mp3";

    // 1. Escuchar avisos del 112 (Manuales)
    const q = query(collection(db, 'emergencyCalls'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe112 = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) return;
      const doc = snapshot.docs[0];
      const call = doc.data() as any;
      const isNew = call.createdAt && (Date.now() - call.createdAt.toDate().getTime()) < 5000;
      const sessionKey = `heard_${doc.id}`;
      
      if (isNew && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        try {
          const ttsPromise = generateEmergencyAudio({
            nombre: call.nombre,
            ubicacion: call.ubicacion,
            motivo: call.motivo,
            unidades: call.unidades
          });
          const intro = new Audio(introSoundUrl);
          intro.volume = 0.6;
          await intro.play();
          const { media } = await ttsPromise;
          const ttsAudio = new Audio(media);
          await ttsAudio.play();
          ttsAudio.onended = () => {
            const outro = new Audio(outroSoundUrl);
            outro.volume = 0.6;
            outro.play();
          };
        } catch (e) {}
      }
    });

    // 2. Polling para Pánicos ERLC
    const pollPanic = async () => {
      const result = await getErlcLogs();
      if (!result.success || !result.logs) return;

      const panicLogs = result.logs.filter((l: any) => l.Log.toLowerCase().includes('panic button'));
      if (panicLogs.length === 0) return;

      const latestPanic = panicLogs[0];
      if (latestPanic.Timestamp > lastProcessedPanicRef.current) {
        lastProcessedPanicRef.current = latestPanic.Timestamp;
        
        // Extraer ubicación del log de ERLC
        const locationMatch = latestPanic.Log.match(/at\s+(.+)$/i);
        const location = locationMatch ? locationMatch[1] : 'Ubicación Desconocida';
        const agentName = latestPanic.Log.split(' has')[0];

        try {
          // Sonido de pánico inmediato
          const panic = new Audio(panicSoundUrl);
          panic.volume = 0.8;
          await panic.play();

          // TTS Despachador rápido
          const ttsPromise = generateEmergencyAudio({
            nombre: agentName,
            ubicacion: location,
            motivo: 'BOTÓN DE PÁNICO ACTIVADO',
            unidades: ['TODAS LAS UNIDADES DISPONIBLES']
          });

          panic.onended = async () => {
            const { media } = await ttsPromise;
            const ttsAudio = new Audio(media);
            await ttsAudio.play();
            ttsAudio.onended = () => {
              new Audio(outroSoundUrl).play();
            };
          };
        } catch (e) {}
      }
    };

    const panicInterval = setInterval(pollPanic, 5000);

    return () => {
      unsubscribe112();
      clearInterval(panicInterval);
    };
  }, [db]);

  const userRef = useMemoFirebase(() => {
    if (!db || !discordUser.id) return null;
    return doc(db, 'users', discordUser.id);
  }, [db, discordUser.id]);

  const { data: userData } = useDoc<any>(userRef);

  useEffect(() => {
    if (db && discordUser.id) {
      setDoc(doc(db, 'users', discordUser.id), {
        username: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
        radio: {
          canalActual: activeChannel || null,
          ultimaConexion: serverTimestamp()
        }
      }, { merge: true });
    }
  }, [activeChannel, db, discordUser.id]);

  const handleSavePlaca = async () => {
    if (db && discordUser.id) {
      await setDoc(doc(db, 'users', discordUser.id), {
        radio: { placa: placaInput }
      }, { merge: true });
      setIsEditingPlaca(false);
    }
  };

  useEffect(() => {
    if (userData?.radio?.placa) {
      setPlacaInput(userData.radio.placa);
    }
  }, [userData?.radio?.placa]);

  const { status, peers, send, setOnMessage } = useRadioWebSocket(
    discordUser.id,
    activeChannel
  );

  const stableSend = useCallback((msg: any) => {
    send(msg);
  }, [send]);

  const { handleSignal, toggleLocalPTT, activeTransmissions, micStatus } = useRadioWebRTC(
    discordUser.id,
    stableSend,
    peers,
    activeChannel
  );

  const { isTransmitting, start, stop } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: !activeChannel });

  useEffect(() => {
    setOnMessage(handleSignal);
  }, [handleSignal, setOnMessage]);

  const activeUsersQuery = useMemoFirebase(() => {
    if (!db || !activeChannel) return null;
    return query(
      collection(db, 'users'),
      where('radio.canalActual', '==', activeChannel)
    );
  }, [db, activeChannel]);

  const { data: channelUsers } = useCollection<any>(activeUsersQuery);

  const getDiscordAvatarUrl = (userId: string, avatarHash: string | null) => {
    return avatarHash 
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 5}.png`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <RadioIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">Radio Comunicaciones</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tenerife RP - Servicios de Emergencia</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          <Link href="/rad" className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 pb-1", pathname === '/rad' ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600")}>
            Frecuencias
          </Link>
          <Link href="/rad/map" className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 pb-1 flex items-center gap-2", pathname === '/rad/map' ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600")}>
            <Bell className="h-3.5 w-3.5" /> Monitor Pánico
          </Link>
          {is112 && (
            <Link href="/rad/112" className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 pb-1 flex items-center gap-2", pathname === '/rad/112' ? "text-red-600 border-red-600" : "text-slate-400 border-transparent hover:text-red-500")}>
              <Activity className="h-3.5 w-3.5" /> Coordinador 112
            </Link>
          )}
        </nav>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{discordUser.global_name || discordUser.username}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isEditingPlaca ? (
                <div className="flex items-center gap-1">
                  <Input value={placaInput} onChange={(e) => setPlacaInput(e.target.value)} className="h-5 w-20 text-[9px] font-bold px-1 py-0 uppercase" autoFocus />
                  <Button size="icon" className="h-5 w-5" onClick={handleSavePlaca}>OK</Button>
                </div>
              ) : (
                <button onClick={() => setIsEditingPlaca(true)} className="text-[9px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-tighter">
                  <Shield className="h-3 w-3" /> Placa: {userData?.radio?.placa || 'SIN ASIGNAR'} <Pencil className="h-2 w-2" />
                </button>
              )}
            </div>
          </div>
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
            <Link href="/api/auth/logout"><LogOut className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[1600px] mx-auto w-full">
        <div className="lg:col-span-3 space-y-8">
          <RadioGrid activeChannel={activeChannel} onJoin={setActiveChannel} onLeave={() => setActiveChannel(null)} peers={peers} wsStatus={status} isTransmitting={isTransmitting} onPTTStart={start} onPTTStop={stop} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <EmergencyCallList />
        </div>
      </main>
    </div>
  );
}
