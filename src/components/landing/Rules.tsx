
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Rules() {
  const norms = [
    {
      q: "¿Qué es el Fair Play en Cádiz RP?",
      a: "Buscamos una experiencia divertida para todos. Evitamos comportamientos tóxicos y priorizamos la narrativa sobre el 'ganar' mecánicamente."
    },
    {
      q: "Metagaming y Powergaming",
      a: "Está estrictamente prohibido usar información obtenida fuera del rol (Discord, streams) o realizar acciones imposibles para un ser humano real."
    },
    {
      q: "Muerte de Personaje (PK/CK)",
      a: "Existen sistemas de muerte temporal (Player Kill) y muerte definitiva (Character Kill). Las muertes definitivas siempre deben estar pactadas o ser fruto de un proceso de rol serio."
    },
    {
      q: "Entorno Histórico",
      a: "Respetamos el léxico y las costumbres de la época. No usamos términos modernos ni tecnología que no existiera en el siglo XVIII."
    }
  ];

  return (
    <section id="normas" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16 space-y-4">
          <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">Normativa</p>
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight">Leyes de la Ciudad</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {norms.map((norm, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-slate-100">
              <AccordionTrigger className="font-headline text-sm font-bold uppercase tracking-wider text-slate-700 hover:text-primary">
                {norm.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-500 font-body leading-relaxed">
                {norm.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
