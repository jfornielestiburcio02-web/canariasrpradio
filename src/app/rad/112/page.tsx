import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, Radio, AlertTriangle, Headset } from 'lucide-react';
import Link from 'next/link';
import { CoordinatorVoiceHandler } from '@/components/radio/CoordinatorVoiceHandler';
import { EmergencyCallModal } from '@/components/radio/EmergencyCallModal';
import { EmergencyCallList } from '@/components/radio/EmergencyCallList';

export default async function Coordinator112Page() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  // Validación directa desde el servidor
  let auth112 = { autorizado: false };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const text = await res.text();
      auth112 = { autorizado: text.includes('true') };
    }
  } catch (e) {
    console.error('[112_PAGE] Error verificando rol:', e);
  }

  if (!auth112.autorizado) {
    redirect('/rad');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600/10 p-2.5 rounded-xl">
            <Headset className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">Centro de Mando 112</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supervisión Institucional</p>
          </div>
        </div>

        <nav className="flex items-center gap-10">
          <Link href="/rad" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-all">
            Frecuencias
          </Link>
          <Link href="/rad/map" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-all">
            Mapa Operativo
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 border-b-2 border-red-600 pb-1 cursor-default flex items-center gap-2">
            <Activity className="h-3 w-3" /> Coordinador 112
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <EmergencyCallModal />
          <Button asChild variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase border-slate-200 ml-2">
            <Link href="/rad"><ArrowLeft className="h-4 w-4 mr-2" /> Salir</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-red-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado Centro</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 uppercase">Operativo</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Canarias Red 112 OK</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-blue-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sistema Audio</CardTitle>
                <Radio className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 uppercase">ONLINE</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">IA Voz Activada</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-emerald-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enlace Externo</CardTitle>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 uppercase">Estable</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Sincronización ER:LC OK</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
             <CoordinatorVoiceHandler discordUser={user} />
          </div>

          <div className="lg:col-span-8">
            <EmergencyCallList isCoordinator={true} />
          </div>
        </div>
      </main>
    </div>
  );
}
