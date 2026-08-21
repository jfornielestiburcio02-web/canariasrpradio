
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';

export default function LoginPage() {
  // URL definitiva 100% proporcionada por el usuario
  const DISCORD_URL = "https://discord.com/oauth2/authorize?client_id=1534483909830512730&response_type=code&redirect_uri=https%3A%2F%2F6000-firebase-studio-1776271662955.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev%2Finicio_desde_menu&scope=identify+guilds.members.read+guilds";
  
  const bgImage = PlaceHolderImages.find(img => img.id === 'tenerife-rp-bg');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white font-sans">
      <Card className="w-full max-w-md border-slate-200 shadow-2xl bg-white rounded-2xl overflow-hidden">
        {/* Línea superior institucional */}
        <div className="h-2 bg-primary w-full" />
        
        <CardHeader className="space-y-6 text-center pt-12 pb-8 px-8">
          <div className="flex justify-center">
            {/* Logo Circular Institucional */}
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-xl ring-1 ring-slate-100 bg-slate-50">
              {bgImage && (
                <Image
                  src={bgImage.imageUrl}
                  alt="Tenerife RP Logo"
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <CardTitle className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-tight">
              Radio Servicios de emergencia
            </CardTitle>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-slate-200" />
              <p className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
                Tenerife RP
              </p>
              <div className="h-px w-8 bg-slate-200" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 px-10 pb-12">
          {/* Divisor estético */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-[0.2em]">
                Autenticación de Agente
              </span>
            </div>
          </div>
          
          <Button 
            asChild
            className="w-full h-14 text-sm font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98] bg-primary hover:bg-primary/90 rounded-xl"
          >
            <Link href={DISCORD_URL}>
              Continuar con Discord
            </Link>
          </Button>
          
          <div className="space-y-6 pt-2">
             <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest px-4 leading-relaxed opacity-70">
              Acceso restringido. El uso no autorizado de este sistema será sancionado según la normativa vigente del cuerpo.
            </p>
            
            {/* Lema Institucional */}
            <div className="flex justify-center items-center gap-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
              <span>Seguridad</span>
              <span>•</span>
              <span>Orden</span>
              <span>•</span>
              <span>Servicio</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
