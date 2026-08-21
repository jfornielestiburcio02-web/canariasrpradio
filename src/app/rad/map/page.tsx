import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { MapTerminal } from '@/components/map/MapTerminal';

export default async function MapPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  // Comprobar permisos en el endpoint externo
  let authStatus = { autorizado: false, mensaje: "Verificando credenciales..." };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_rol?userId=${user.id}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      authStatus = await res.json();
    } else {
      authStatus = { autorizado: false, mensaje: "El servicio de validación no respondió correctamente." };
    }
  } catch (error) {
    console.error("Role Check Error:", error);
    authStatus = { autorizado: false, mensaje: "No se pudo establecer conexión con el centro de mando (API)." };
  }

  if (!authStatus.autorizado) {
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
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
              Acceso Restringido
            </CardTitle>
            <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] mt-2">
              Error de Autorización
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-8 px-10 pb-12 pt-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "{authStatus.mensaje}"
            </div>
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2.5 rounded-xl">
            <MapIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase leading-none">Visor Táctico</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Liberty County - ERLC Integration</p>
          </div>
        </div>

        <nav className="flex items-center gap-8">
          <Link href="/rad" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">
            Radio
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b-2 border-primary pb-1 cursor-default">
            Mapa
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right">
             <span className="text-[10px] font-bold text-white block uppercase tracking-tighter">{user.global_name || user.username}</span>
             <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Enlace Satelital Activo</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <MapTerminal discordUser={user} />
      </main>
    </div>
  );
}
