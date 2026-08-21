
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { handleDiscordAuth } from '@/app/actions/auth';
import { type DiscordUser } from '@/app/lib/auth-utils';
import { Loader2, ShieldCheck, Radio, User, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function AuthContent() {
  const searchParams = useSearchParams();
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
            setError(res.error || 'Error desconocido');
          }
        })
        .catch(() => setError('Error de conexión con el servidor'))
        .finally(() => setLoading(false));
    }
  }, [code, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Validando credenciales...</p>
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
          <CardTitle className="text-xl font-bold text-destructive">Error de Autenticación</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-sm text-slate-500">{error}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Reintentar</Link>
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
      <Card className="w-full max-w-md border-border shadow-2xl bg-white/95 overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-primary/10">
              <Image 
                src={avatarUrl} 
                alt={user.username} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">{user.global_name || user.username}</CardTitle>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Agente Identificado</p>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-[0.1em]">Sistemas Disponibles</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button asChild className="h-14 bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md">
              <Link href="/jef" className="flex items-center justify-between px-6">
                <span className="text-xs font-bold uppercase tracking-widest">Acceso Jefaturas</span>
                <ShieldCheck className="h-5 w-5 opacity-50" />
              </Link>
            </Button>

            <Button asChild className="h-14 bg-primary hover:bg-primary/90 text-white border-none shadow-md">
              <Link href="/rad" className="flex items-center justify-between px-6">
                <span className="text-xs font-bold uppercase tracking-widest">Acceso a Radios / 112</span>
                <Radio className="h-5 w-5 opacity-50" />
              </Link>
            </Button>
          </div>

          <p className="text-center text-[9px] text-slate-400 font-medium pt-2">
            Autenticación recibida correctamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-slate-300" />}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
