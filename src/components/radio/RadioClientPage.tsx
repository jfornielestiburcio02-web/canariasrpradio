
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { RadioChannel, SignalingMessage } from '@/types/radio';
import { useRadioWebSocket } from '@/hooks/useRadioWebSocket';
import { useRadioWebRTC } from '@/hooks/useRadioWebRTC';
import { usePTT } from '@/hooks/usePTT';
import { RadioGrid } from '@/components/radio/RadioGrid';
import { Radio as RadioIcon, LogOut, Shield, BadgeCheck, Pencil, Settings2, Keyboard, Headset, Bell, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot, where, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EmergencyCallList } from './EmergencyCallList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface RadioClientPageProps {
  discordUser: DiscordUser;
  is112?: boolean;
  isAdminVs?: boolean;
}

export default function RadioClientPage({ discordUser, is112 = false, isAdminVs = false }: RadioClientPageProps) {
  const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);
  const [isEditingPlaca, setIsEditingPlaca] = useState(false);
  const [placaInput, setPlacaInput] = useState('');
  const [pttKey, setPttKey] = useState('Space');
  const [panicKey, setPanicKey] = useState('Delete');
  const [isListeningKey, setIsListeningKey] = useState<'ptt' | 'panic' | null>(null);
  const [panicLoading, setPanicLoading] = useState(false);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const db = useFirestore();
  
  // Capturamos el inicio de sesión EXACTO para filtrar avisos antiguos
  const sessionStartTime = useRef(Date.now());
  const lastSyncChannel = useRef<string | null>(null);
  const lastSyncPlaca = useRef<string | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!db || !discordUser.id) return null;
    return doc(db, 'users', discordUser.id);
  }, [db, discordUser.id]);

  const { data: userData } = useDoc<any>(userRef);

  // --- Lógica de Pánico ---
  const triggerPanic = useCallback(async () => {
    if (!db || panicLoading) return;
    setPanicLoading(true);
    try {
      const placa = userData?.radio?.placa || 'SIN ASIGNAR';
      await addDoc(collection(db, 'erlcEvents'), {
        tipo: 'PANICO',
        sujeto: discordUser.global_name || discordUser.username,
        ubicacion: 'UBICACIÓN RADIO',
        detalles: `Pánico activado por el agente con placa ${placa}`,
        timestamp: serverTimestamp()
      });
      toast({
        title: "PÁNICO ENVIADO",
        description: "Se ha alertado a toda la red institucional.",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setPanicLoading(false);
    }
  }, [db, panicLoading, userData?.radio?.placa, discordUser.global_name, discordUser.username, toast]);

  // --- Listener Global de Pánico (Audio) ---
  useEffect(() => {
    if (!db) return;
    const panicAlertUrl = "https://www.myinstants.com/media/sounds/panic-button.mp3";

    const qPanic = query(
      collection(db, 'erlcEvents'), 
      where('tipo', '==', 'PANICO'),
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
    
    const unsubscribePanic = onSnapshot(qPanic, (snapshot) => {
      if (snapshot.empty) return;
      const event = snapshot.docs[0].data();
      const eventId = snapshot.docs[0].id;
      const eventTime = event.timestamp?.toDate().getTime() || 0;
      const sessionKey = `panic_${eventId}`;

      if (eventTime > sessionStartTime.current && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        
        const audio = new Audio(panicAlertUrl);
        audio.play().catch(() => {});
        
        const msg = new SpeechSynthesisUtterance(`Alerta pánico, pulsado por el agente ${event.sujeto}. Repito, pánico activado.`);
        msg.lang = 'es-ES';
        window.speechSynthesis.speak(msg);

        toast({
          variant: "destructive",
          title: "¡BOTÓN DE PÁNICO ACTIVADO!",
          description: `Agente ${event.sujeto}`,
          duration: 10000,
        });
      }
    });

    return () => unsubscribePanic();
  }, [db, toast]);

  // --- Listener Global de Emergencias 112 (Audio Sincronizado) ---
  useEffect(() => {
    if (!db) return;
    const startSoundUrl = "https://res.cloudinary.com/dgvh0c87y/video/upload/v1787391237/1514375003628376116_phw9ti.ogg";
    const endSoundUrl = "https://res.cloudinary.com/dgvh0c87y/video/upload/v1787391249/radio_finalizar_invertido_aiifyo.ogg";

    const qCalls = query(
      collection(db, 'emergencyCalls'), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );

    const unsubscribeCalls = onSnapshot(qCalls, (snapshot) => {
      if (snapshot.empty) return;
      const call = snapshot.docs[0].data();
      const callId = snapshot.docs[0].id;
      const callTime = call.createdAt?.toDate().getTime() || 0;
      const sessionKey = `call_alert_${callId}`;

      // Solo avisos posteriores a la carga de la página que no hayan sonado
      if (callTime > sessionStartTime.current && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        
        const startAudio = new Audio(startSoundUrl);
        startAudio.play().then(() => {
          startAudio.onended = () => {
            const text = `${call.motivo}. En ${call.ubicacion}. Unidades: ${call.unidades.join(', ')}.`;
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'es-ES';
            msg.rate = 0.9;
            msg.onend = () => {
              const endAudio = new Audio(endSoundUrl);
              endAudio.play().catch(() => {});
            };
            window.speechSynthesis.speak(msg);
          };
        }).catch(() => {
          // Si el audio inicial falla (bloqueo navegador), ejecutamos al menos el TTS
          const text = `${call.motivo}. En ${call.ubicacion}. Unidades: ${call.unidades.join(', ')}.`;
          const msg = new SpeechSynthesisUtterance(text);
          msg.lang = 'es-ES';
          window.speechSynthesis.speak(msg);
        });

        toast({
          title: "CENTRO DE MANDO 112",
          description: `${call.motivo} en ${call.ubicacion}`,
          duration: 12000,
        });
      }
    });

    return () => unsubscribeCalls();
  }, [db, toast]);

  // --- Ajustes y Teclas ---
  useEffect(() => {
    const savedPtt = localStorage.getItem('radio_ptt_key');
    const savedPanic = localStorage.getItem('radio_panic_key');
    if (savedPtt) setPttKey(savedPtt);
    if (savedPanic) setPanicKey(savedPanic);
  }, []);

  const handleSetKey = (key: string) => {
    if (isListeningKey === 'ptt') {
      setPttKey(key);
      localStorage.setItem('radio_ptt_key', key);
    } else if (isListeningKey === 'panic') {
      setPanicKey(key);
      localStorage.setItem('radio_panic_key', key);
    }
    setIsListeningKey(null);
  };

  useEffect(() => {
    if (!isListeningKey) return;
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      handleSetKey(e.code);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isListeningKey]);

  useEffect(() => {
    const handlePanicKeyDown = (e: KeyboardEvent) => {
      if (isMobile || isListeningKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === panicKey) {
        e.preventDefault();
        triggerPanic();
      }
    };
    window.addEventListener('keydown', handlePanicKeyDown);
    return () => window.removeEventListener('keydown', handlePanicKeyDown);
  }, [panicKey, triggerPanic, isMobile, isListeningKey]);

  // --- Sincronización Estable Firestore ---
  useEffect(() => {
    if (!db || !discordUser.id) return;
    if (lastSyncChannel.current === activeChannel) return;
    
    lastSyncChannel.current = activeChannel;
    setDoc(doc(db, 'users', discordUser.id), {
      username: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      radio: {
        canalActual: activeChannel || null,
        ultimaConexion: serverTimestamp()
      }
    }, { merge: true });
  }, [activeChannel, db, discordUser]);

  const handleSavePlaca = async () => {
    if (db && discordUser.id && placaInput !== lastSyncPlaca.current) {
      lastSyncPlaca.current = placaInput;
      await setDoc(doc(db, 'users', discordUser.id), {
        radio: { placa: placaInput }
      }, { merge: true });
      setIsEditingPlaca(false);
    }
  };

  useEffect(() => {
    if (userData?.radio?.placa && !isEditingPlaca && userData.radio.placa !== placaInput) {
      setPlacaInput(userData.radio.placa);
      lastSyncPlaca.current = userData.radio.placa;
    }
  }, [userData?.radio?.placa, isEditingPlaca]);

  // --- Lógica WebRTC / WS ---
  const agentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('radio.canalActual', '!=', null));
  }, [db]);

  const { data: agentsInRadio } = useCollection<any>(agentsQuery);

  const { status, peers, send, setOnMessage } = useRadioWebSocket(discordUser.id, activeChannel);
  
  const handleKickSignal = useCallback((msg: SignalingMessage) => {
    if (msg.type === 'force_leave' && msg.to === discordUser.id) {
      setActiveChannel(null);
      toast({
        variant: "destructive",
        title: "SISTEMA: EXPULSIÓN",
        description: "Un administrador ha retirado tu señal de la frecuencia.",
      });
    }
  }, [discordUser.id, toast]);

  const stableSend = useCallback((msg: any) => send(msg), [send]);
  const { handleSignal: webrtcHandler, toggleLocalPTT, activeTransmissions } = useRadioWebRTC(discordUser.id, stableSend, peers, activeChannel);
  
  const { isTransmitting, start, stop, toggle } = usePTT((enabled) => {
    toggleLocalPTT(enabled);
  }, { disabled: !activeChannel, pttKey, isMobile });

  useEffect(() => {
    setOnMessage((msg) => {
      handleKickSignal(msg);
      webrtcHandler(msg);
    });
  }, [handleKickSignal, webrtcHandler, setOnMessage]);

  const handleKickAgent = (targetUserId: string) => {
    if (!isAdminVs || !activeChannel) return;
    send({ type: 'force_leave', to: targetUserId, channel: activeChannel });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <RadioIcon className="h-6 w-6 text-primary" />
          </div>
          <nav className="hidden md:flex items-center gap-8 ml-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b-2 border-primary pb-1">Red Radio</span>
            <Link href="/rad/map" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-all flex items-center gap-2">
              <Bell className="h-3 w-3" /> Monitor Institucional
            </Link>
            {is112 && (
              <Link href="/rad/112" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-all flex items-center gap-2">
                <Headset className="h-3 w-3" /> Coordinador 112
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{discordUser.global_name || discordUser.username}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isEditingPlaca ? (
                <div className="flex items-center gap-1">
                  <Input 
                    value={placaInput} 
                    onChange={(e) => setPlacaInput(e.target.value.toUpperCase())} 
                    className="h-5 w-20 text-[9px] font-bold px-1 py-0 uppercase" 
                    autoFocus 
                  />
                  <Button size="icon" className="h-5 w-5 bg-primary text-white" onClick={handleSavePlaca}>OK</Button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingPlaca(true)} 
                  className="text-[9px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-tighter"
                >
                  <Shield className="h-3 w-3" /> Placa: {userData?.radio?.placa || 'SIN ASIGNAR'} <Pencil className="h-2 w-2" />
                </button>
              )}
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200">
                <Settings2 className="h-4 w-4 text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 rounded-2xl border-none shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-800">
                  <Keyboard className="h-4 w-4" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Ajustes del Sistema</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Tecla Pulsar para Hablar (PTT)</p>
                    <Button 
                      variant="secondary" 
                      className={cn("w-full h-10 text-[10px] font-black uppercase rounded-xl", isListeningKey === 'ptt' && "animate-pulse border-primary")}
                      onClick={() => setIsListeningKey('ptt')}
                    >
                      {isListeningKey === 'ptt' ? 'PULSA TECLA...' : pttKey}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Tecla de Pánico</p>
                    <Button 
                      variant="secondary" 
                      className={cn("w-full h-10 text-[10px] font-black uppercase rounded-xl", isListeningKey === 'panic' && "animate-pulse border-red-500")}
                      onClick={() => setIsListeningKey('panic')}
                    >
                      {isListeningKey === 'panic' ? 'PULSA TECLA...' : panicKey}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
            <Link href="/api/auth/logout"><LogOut className="h-5 w-5" /></Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        <div className="lg:col-span-3 h-full overflow-hidden">
          <RadioGrid 
            activeChannel={activeChannel} 
            onJoin={setActiveChannel} 
            onLeave={() => setActiveChannel(null)} 
            peers={peers} 
            wsStatus={status} 
            isTransmitting={isTransmitting} 
            onPTTStart={start} 
            onPTTStop={stop}
            onPTTToggle={toggle}
            isMobile={isMobile}
            agents={agentsInRadio || []}
            isAdmin={isAdminVs}
            onKick={handleKickAgent}
            currentUserId={discordUser.id}
          />
        </div>
        <div className="lg:col-span-1">
          <EmergencyCallList isCoordinator={is112} />
        </div>
      </main>
    </div>
  );
}
