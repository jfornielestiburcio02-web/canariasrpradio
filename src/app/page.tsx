import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { Ship, Anchor, Waves, History, Sparkles } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'cadiz-coast');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Anchor className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">Cadiz Roleplay</h1>
        </div>
        <nav className="hidden md:flex gap-8">
          <Link href="#" className="text-sm font-medium hover:text-accent transition-colors">Lore</Link>
          <Link href="#" className="text-sm font-medium hover:text-accent transition-colors">Normas</Link>
          <Link href="#" className="text-sm font-medium hover:text-accent transition-colors">Comunidad</Link>
        </nav>
        <Button asChild className="bg-primary text-white">
          <Link href="/api/auth/login">Iniciar Sesión</Link>
        </Button>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-background/80" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-bold uppercase tracking-wider mb-4">
              <Waves className="h-4 w-4" />
              El Puerto de la Historia
            </div>
            <h2 className="font-headline text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight">
              Escribe tu propio destino en la Tacita de Plata
            </h2>
            <p className="text-lg md:text-xl text-white/90 font-body max-w-2xl mx-auto leading-relaxed">
              Únete a la experiencia de rol más inmersiva basada en el Cádiz histórico y marítimo. Aventuras, comercio e intrigas te esperan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg font-bold shadow-xl shadow-accent/20">
                <Link href="/api/auth/login" className="flex items-center gap-2">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                  Login con Discord
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-white text-white hover:bg-white/10 backdrop-blur-sm">
                <Link href="#features">Descubrir más</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4 text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <History className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-2xl font-bold">Historia Viva</h3>
                <p className="text-muted-foreground">Explora un Cádiz detallado en la época dorada del comercio con las Indias.</p>
              </div>
              <div className="space-y-4 text-center">
                <div className="bg-accent/10 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Ship className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-headline text-2xl font-bold">Aventura Naval</h3>
                <p className="text-muted-foreground">Forma parte de tripulaciones, combate contra piratería o forja tu fortuna como mercante.</p>
              </div>
              <div className="space-y-4 text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-2xl font-bold">IA Creativa</h3>
                <p className="text-muted-foreground">Utiliza nuestras herramientas inteligentes para crear trasfondos y misiones únicas.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-12 text-white/60 border-t border-white/10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            <span className="font-headline text-xl font-bold text-white">Cadiz Roleplay</span>
          </div>
          <p className="text-sm">© 2024 Cadiz Roleplay. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-accent transition-colors">Discord</Link>
            <Link href="#" className="hover:text-accent transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-accent transition-colors">Normativa</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
