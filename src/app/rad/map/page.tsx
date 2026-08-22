import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Bell, Activity } from 'lucide-react';
import Link from 'next/link';
import { MapTerminal } from '@/components/map/MapTerminal';
import { cn } from '@/lib/utils';

export default async function MapPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  // Comprobación de roles simplificada
  let authRol = { autorizado: false, mensaje: "" };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_rol?userId=${user.id}`, { cache: 'no-store' });
    if (res.ok) authRol = await res.json();
  } catch (e) {}

  let auth112 = { autorizado: false, mensaje: "" };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, { cache: 'no-store' });
    if (res.ok) auth112 = await res.json();
  } catch (e) {}

  const isAuthorized = authRol.autorizado || auth112.autorizado;
  const errorMsg = auth112.mensaje || authRol.mensaje || "Acceso denegado.";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white overflow-hidden">
          <div className="h-2 bg-destructive w-full" />
          <CardHeader className="text-center pt-10 px-8">
            <div className="flex justify-center mb-6">
              <div className="bg-destructive/10 p-5 rounded-full ring-8 ring-destructive/5">
                <ShieldAlert className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-8 px-10 pb-12 pt-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600 text-sm">{errorMsg}</div>
            <Button asChild className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
              <Link href="/rad" className="flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-bold">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600/10 p-2.5 rounded-xl">
            <Bell className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">Monitor de Pánico</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Liberty County - Detección Satelital</p>
          </div>
        </div>

        <nav className="flex items-center gap-10">
          <Link href="/rad" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-all">Frecuencias</Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 border-b-2 border-red-600 pb-1 cursor-default">Monitor Pánico</span>
          {auth112.autorizado && (
            <Link href="/rad/112" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-all flex items-center gap-2">
              <Activity className="h-3 w-3" /> Coordinador 112
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase border-slate-200">
            <Link href="/rad"><ArrowLeft className="h-4 w-4 mr-2" /> Salir</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <MapTerminal discordUser={user} />
      </main>
    </div>
  );
}
