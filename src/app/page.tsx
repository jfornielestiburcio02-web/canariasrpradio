
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Lore } from '@/components/landing/Lore';
import { Rules } from '@/components/landing/Rules';
import { Community } from '@/components/landing/Community';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen scroll-smooth">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Lore />
        <Rules />
        <Community />
      </main>
      <Footer />
    </div>
  );
}
