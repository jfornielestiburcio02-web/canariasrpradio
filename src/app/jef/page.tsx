import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Forzamos dinamismo absoluto para asegurar la lectura de la cookie global
export const dynamic = 'force-dynamic';

export default async function JefaturasPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/inicio_desde_menu">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-slate-200">
              <Image src={avatarUrl} alt={user.username} fill unoptimized />
            </div>
            <Button asChild variant="ghost" className="text-slate-400 hover:text-red-500">
              <Link href="/api/auth/logout"><LogOut className="h-5 w-5" /></Link>
            </Button>
          </div>
        </header>

        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-slate-900 w-full" />
          <CardHeader className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-900/5 p-6 rounded-full">
                <ShieldCheck className="h-16 w-16 text-slate-900" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Acceso a Jefaturas</CardTitle>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Personal de Alto Rango</p>
          </CardHeader>
          <CardContent className="px-12 pb-16 space-y-8">
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-slate-600 font-medium leading-relaxed">
                Bienvenido, <span className="font-bold text-slate-900">{user.global_name || user.username}</span>. 
                Esta sección está reservada para la gestión administrativa y operativa de los mandos de Tenerife RP.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button disabled className="h-16 bg-white border border-slate-200 text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-50">
                Gestión de Personal
              </Button>
              <Button disabled className="h-16 bg-white border border-slate-200 text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-50">
                Informes Operativos
              </Button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">
              Módulo en desarrollo • Tenerife RP
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
