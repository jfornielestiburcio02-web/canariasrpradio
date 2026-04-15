
import Image from 'next/image';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';

export function Lore() {
  const loreImage = PlaceHolderImages.find(img => img.id === 'old-city-stone');

  return (
    <section id="lore" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <p className="text-accent text-[10px] font-bold uppercase tracking-[0.4em]">El escenario</p>
            <h2 className="font-headline text-4xl font-bold text-slate-900 leading-tight uppercase tracking-tight">Cádiz, la Joya del Atlántico</h2>
            <p className="text-slate-600 leading-relaxed font-body">
              Año 1717. El traslado de la Casa de Contratación de Sevilla a Cádiz ha convertido a la ciudad en el centro neurálgico del comercio con las Indias. Las murallas de la ciudad resguardan una ebullición constante de culturas, fortunas y secretos.
            </p>
            <p className="text-slate-600 leading-relaxed font-body">
              Mientras los galeones cargados de plata y especias atracan en el muelle, en las tabernas de El Pópulo se deciden destinos. Eres libre de ser un humilde pescador, un ambicioso burgués o un capitán que busca gloria en los horizontes desconocidos.
            </p>
          </div>
          <div className="lg:w-1/2 relative h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl">
            {loreImage && (
              <Image 
                src={loreImage.imageUrl}
                alt="Cádiz Histórico"
                fill
                className="object-cover"
                data-ai-hint="old city"
              />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
