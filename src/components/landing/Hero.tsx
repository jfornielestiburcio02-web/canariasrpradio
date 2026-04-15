
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { Waves } from 'lucide-react';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'cadiz-coast');

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {heroImage && (
          <Image 
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover brightness-[0.4]"
            priority
            data-ai-hint="cadiz coast"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
          <Waves className="h-4 w-4" />
          Experiencia de Rol Histórico
        </div>
        <h2 className="font-headline text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight uppercase tracking-tighter">
          Donde el Mar se hace Ley
        </h2>
        <p className="text-lg md:text-xl text-white/80 font-body max-w-2xl mx-auto leading-relaxed">
          Navega por las aguas del siglo XVIII en el puerto más importante del mundo. Forja tu leyenda entre mercaderes, piratas y la marina real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-10 text-xs font-bold uppercase tracking-widest shadow-xl shadow-accent/20">
            <Link href="/api/auth/login">Empezar travesía</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-10 text-xs font-bold uppercase tracking-widest border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
            <Link href="#lore">Ver Historia</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
