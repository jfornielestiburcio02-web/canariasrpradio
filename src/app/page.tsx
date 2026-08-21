
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';

export default function LoginPage() {
  const DISCORD_URL = "https://discord.com/oauth2/authorize?client_id=1534483909830512730&response_type=code&redirect_uri=https%3A%2F%2F6000-firebase-studio-1776271662955.cluster-cbeiita7rbe7iuwhvjs5zww2i.cloudworkstations.dev%2Finicio_desde_menu&integration_type=0&scope=identify+applications.commands+guilds.members.read";
  
  const bgImage = PlaceHolderImages.find(img => img.id === 'tenerife-rp-bg');

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt="Tenerife RP Background"
            fill
            className="object-cover"
            priority
            data-ai-hint="emergency services"
          />
        )}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-border shadow-2xl bg-white/95">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Radio Servicios de emergencia
            </CardTitle>
            <p className="text-lg font-semibold text-primary uppercase tracking-widest">
              Tenerife RP
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-normal">
              Iniciar sesión
            </h3>
          </div>
          <Button 
            asChild
            className="w-full h-14 text-base font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href={DISCORD_URL}>
              Continuar con Discord
            </Link>
          </Button>
          <p className="text-center text-[10px] text-slate-400 font-medium px-8">
            Acceso restringido para personal autorizado de los servicios de emergencia de Tenerife.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
