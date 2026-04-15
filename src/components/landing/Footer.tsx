
import { Anchor } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 py-16 text-slate-500 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Anchor className="h-6 w-6 text-accent" />
              <span className="font-headline text-xl font-bold uppercase tracking-tight">Cadiz RP</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed">
              Plataforma de rol histórico ambientada en el Cádiz del siglo XVIII. Un proyecto creado por y para la comunidad.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="text-white text-[10px] font-bold uppercase tracking-widest">Navegación</h4>
              <nav className="flex flex-col gap-2 text-xs">
                <Link href="#lore" className="hover:text-white transition-colors">Historia</Link>
                <Link href="#normas" className="hover:text-white transition-colors">Leyes</Link>
                <Link href="#comunidad" className="hover:text-white transition-colors">Comunidad</Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-white text-[10px] font-bold uppercase tracking-widest">Legal</h4>
              <nav className="flex flex-col gap-2 text-xs">
                <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
                <Link href="#" className="hover:text-white transition-colors">Términos</Link>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em]">
          <p>© 2024 CADIZ ROLEPLAY. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">Discord</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
