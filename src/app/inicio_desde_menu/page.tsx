
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { handleDiscordAuth } from '@/app/actions/auth';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Loader2, ShieldCheck, Radio, AlertCircle, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(!!code);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code && !user) {
      handleDiscordAuth(code)
        .then((res) => {
          if (res.success) {
            setUser(res.user);
          } else {
            setError(res.error || 'Error de autenticación');
          }
        })
        .catch(() => setError('Error de conexión'))
        .finally(() => setLoading(false));
    }
  }, [code, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando con la red...</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Estableciendo sesión segura</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-destructive/20 shadow-2xl bg-white/95">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-destructive">Error de Acceso</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-sm text-slate-500">{error}</p>
          <Button asChild variant="outline" className="w-full h-12">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    const avatarUrl = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`;

    return (
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
            <Button asChild className="h-16 bg-slate-900 hover:bg-slate-800 text-white border-none shadow-xl transition-all hover:scale-[1.02]">
              <Link href="/jef" className="flex items-center justify-between px-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso Jefaturas</span>
                <ShieldCheck className="h-6 w-6 opacity-40" />
              </Link>
            </Button>

            <Button asChild className="h-16 bg-primary hover:bg-primary/90 text-white border-none shadow-xl transition-all hover:scale-[1.02]">
              <Link href="/rad" className="flex items-center justify-between px-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso a Radios / 112</span>
                <Radio className="h-6 w-6 opacity-40" />
              </Link>
            </Button>
          </div>

          <div className="pt-4 flex justify-center">
            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-red-500">
              <Link href="/api/auth/logout" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />
      
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-slate-200" />}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
