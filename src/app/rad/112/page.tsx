
import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Activity, Radio, AlertTriangle, Users, Headset } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CoordinatorVoiceHandler } from '@/components/radio/CoordinatorVoiceHandler';

export default async function Coordinator112Page() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  // Comprobar rol 112
  let auth112 = { autorizado: false, mensaje: "" };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const text = await res.text();
      if (text) auth112 = JSON.parse(text);
    }
  } catch (e) {
    console.error('Error verificando 112:', e);
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supervisión de Emergencias Canarias</p>
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
          <Button asChild variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase border-slate-200">
            <Link href="/rad"><ArrowLeft className="h-4 w-4 mr-2" /> Salir a Frecuencias</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-red-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Líneas en Servicio</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">3</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Capacidad Máxima Activa</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-blue-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado de Red</CardTitle>
                <Radio className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 uppercase">Estable</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Sincronización WebRTC OK</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl overflow-hidden group">
            <div className="h-1.5 bg-emerald-600 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seguridad Operativa</CardTitle>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 uppercase">Óptimo</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Canal 112 Aislado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <CoordinatorVoiceHandler discordUser={user} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden">
              <div className="p-8 text-center space-y-6">
                <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto">
                  <Users className="h-12 w-12 text-slate-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Panel de Gestión 112</h2>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-2 font-medium uppercase tracking-widest leading-relaxed">
                    Como coordinador, tu deber es responder a las llamadas ciudadanas. El sistema te permite elegir una de las 3 líneas disponibles para atender casos individuales.
                  </p>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest">
                    Identificación Real Activa
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>{children}</span>;
}
