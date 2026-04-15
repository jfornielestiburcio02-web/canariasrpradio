
import { History, Ship, Sparkles } from 'lucide-react';

export function Features() {
  const features = [
    {
      title: "Historia Viva",
      desc: "Un Cádiz meticulosamente recreado en su época de máximo esplendor comercial.",
      icon: History,
      color: "text-primary",
      bg: "bg-primary/5"
    },
    {
      title: "Vida Marítima",
      desc: "Sistemas avanzados de navegación, comercio y combate naval en tiempo real.",
      icon: Ship,
      color: "text-accent",
      bg: "bg-accent/5"
    },
    {
      title: "IA Narrativa",
      desc: "Herramientas inteligentes para ayudarte a crear ganchos de rol y misiones únicas.",
      icon: Sparkles,
      color: "text-emerald-500",
      bg: "bg-emerald-500/5"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <div key={i} className="group p-8 rounded-3xl hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-100">
              <div className={`${f.bg} h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <f.icon className={`h-7 w-7 ${f.color}`} />
              </div>
              <h3 className="font-headline text-lg font-bold uppercase tracking-wider mb-3">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
