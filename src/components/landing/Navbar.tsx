
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Anchor } from 'lucide-react';

export function Navbar() {
  return (
    <header className="px-6 h-20 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Anchor className="h-6 w-6 text-primary" />
        <div className="flex flex-col">
          <h1 className="font-headline text-xl font-bold text-primary tracking-tight leading-none uppercase">Cadiz RP</h1>
          <p className="text-[9px] tracking-[0.2em] text-slate-400 font-bold uppercase">Puerto de la historia</p>
        </div>
      </div>
      <nav className="hidden md:flex gap-8">
        <Link href="#lore" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Lore</Link>
        <Link href="#normas" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Normas</Link>
        <Link href="#comunidad" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Comunidad</Link>
      </nav>
      <Button asChild className="bg-primary text-white font-bold text-xs uppercase tracking-widest px-6">
        <Link href="/api/auth/login">Entrar</Link>
      </Button>
    </header>
  );
}
