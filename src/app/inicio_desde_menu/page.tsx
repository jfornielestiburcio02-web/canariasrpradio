import { getSessionUser } from '@/app/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Radio, LogOut, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InicioDesdeMenuPage() {
  console.log('[INICIO_PAGE] Verificando sesión tras redirección...');
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white text-center p-10">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Sesión no encontrada</h2>
          <p className="text-sm text-slate-500 mt-2">No hemos podido validar tu identidad de forma persistente.</p>
          <a href="/" className="mt-6 inline-flex items-center justify-center w-full h-12 bg-primary text-white rounded-lg font-bold">
            Volver al Login
          </a>
        </Card>
      </div>
    );
  }

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />
      
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="text-center pb-4 pt-10">
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-2 ring-primary/5">
              <Image 
                src={avatarUrl} 
                alt={user.username} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 leading-tight">
            {user.global_name || user.username}
          </CardTitle>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-2">Agente Identificado</p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4 px-10 pb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-[0.2em]">Sistemas Operativos</span>
            </div>
          </div>

          <div className="grid gap-4">
            <Link 
              href="/jef" 
              prefetch={false}
              className="flex items-center justify-between h-16 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl transition-all"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso Jefaturas</span>
              <ShieldCheck className="h-6 w-6 opacity-40" />
            </Link>

            <Link 
              href="/rad" 
              prefetch={false}
              className="flex items-center justify-between h-16 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl transition-all"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso a Radios / 112</span>
              <Radio className="h-6 w-6 opacity-40" />
            </Link>
          </div>

          <div className="pt-4 flex justify-center">
            <a href="/api/auth/logout" className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
