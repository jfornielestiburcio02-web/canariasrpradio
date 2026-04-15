
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function Community() {
  return (
    <section id="comunidad" className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[120px]" />
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10 space-y-8">
        <h2 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none">Únete a la Tripulación</h2>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto font-body text-lg">
          Nuestra comunidad es el corazón del proyecto. Únete a Discord para presentar tu historia, conocer a otros marineros y estar al tanto de las novedades.
        </p>
        <div className="flex justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold uppercase tracking-widest px-10 h-16 rounded-2xl shadow-2xl">
            <MessageSquare className="mr-3 h-5 w-5" /> Servidor de Discord
          </Button>
        </div>
      </div>
    </section>
  );
}
