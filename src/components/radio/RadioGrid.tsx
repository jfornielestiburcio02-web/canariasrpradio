
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { RadioCard } from './RadioCard';
import { 
  Shield, Ambulance, Truck, Flame, Anchor, User, Zap, 
  Target, Users, Radio as RadioIcon, Mountain, HeartPulse, Crosshair, Stethoscope,
  ChevronRight, Search
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface RadioGridProps {
  activeChannel: RadioChannel | null;
  onJoin: (channel: RadioChannel) => void;
  onLeave: () => void;
  peers: string[];
  wsStatus: WSStatus;
  isTransmitting: boolean;
  onPTTStart: () => void;
  onPTTStop: () => void;
  onPTTToggle: () => void;
  isMobile: boolean;
  agents: any[];
  isAdmin?: boolean;
  onKick?: (userId: string) => void;
  currentUserId?: string;
}

export function RadioGrid({
  activeChannel,
  onJoin,
  onLeave,
  peers,
  wsStatus,
  isTransmitting,
  onPTTStart,
  onPTTStop,
  onPTTToggle,
  isMobile,
  agents,
  isAdmin = false,
  onKick,
  currentUserId
}: RadioGridProps) {
  const [search, setSearch] = useState('');

  const categories = [
    {
      name: "🇪🇸 Policía Nacional",
      icon: <Shield className="h-4 w-4 text-blue-600" />,
      units: [
        { name: "Coordinación CNP", channels: ['CNP_COORD', 'CNP_HOTEL_50'] },
        { name: "Seguridad Ciudadana", channels: ['CNP_ZETA_10', 'CNP_ZETA_20', 'CNP_ZETA_30', 'CNP_ZETA_40', 'CNP_ZETA_50', 'CNP_ZETA_60', 'CNP_ZETA_70', 'CNP_ZETA_80'] },
        { name: "UIP / UPR", channels: ['CNP_DRAGON_1', 'CNP_DRAGON_2', 'CNP_DRAGON_3', 'CNP_DRAGON_4', 'CNP_UPR_10', 'CNP_UPR_20', 'CNP_UPR_30', 'CNP_UPR_40', 'CNP_UPR_50'] },
        { name: "GEO / Especiales", channels: ['CNP_GEO_1', 'CNP_GEO_2', 'CNP_GEO_3', 'CNP_PJ_10', 'CNP_PJ_20', 'CNP_PJ_30', 'CNP_PJ_40'] },
        { name: "Información y Otros", channels: ['CNP_INFO_10', 'CNP_INFO_20', 'CNP_INFO_30', 'CNP_FRONTERA_10', 'CNP_TEDAX_1', 'CNP_TAC_1'] },
      ]
    },
    {
      name: "👮 Policía Local",
      icon: <User className="h-4 w-4 text-sky-400" />,
      units: [
        { name: "Seguridad Ciudadana", channels: ['PL_POLICIA_10', 'PL_POLICIA_20', 'PL_POLICIA_30', 'PL_POLICIA_40', 'PL_POLICIA_50', 'PL_POLICIA_60', 'PL_POLICIA_70', 'PL_POLICIA_80'] },
        { name: "Unidades Especiales", channels: ['PL_MOTO_10', 'PL_TRAFICO_10', 'PL_ATESTA_1', 'PL_INTER_1', 'PL_K9_1', 'PL_MANDO_1'] },
      ]
    },
    {
      name: "🟢 Guardia Civil",
      icon: <Anchor className="h-4 w-4 text-emerald-600" />,
      units: [
        { name: "Seguridad Ciudadana", channels: ['GC_GUARDIA_10', 'GC_GUARDIA_20', 'GC_GUARDIA_30', 'GC_GUARDIA_40', 'GC_GUARDIA_50', 'GC_GUARDIA_60', 'GC_GUARDIA_70', 'GC_GUARDIA_80'] },
        { name: "Especialidades", channels: ['GC_TRAFICO_10', 'GC_SEPRONA_10', 'GC_GEAS_1', 'GC_MARITIMO_1', 'GC_USECIC_1', 'GC_UHEL_11', 'GC_COS_1'] },
      ]
    },
    {
      name: "🚒 Bomberos",
      icon: <Flame className="h-4 w-4 text-red-600" />,
      units: [
        { name: "Extinción", channels: ['BOM_BRAVO_10', 'BOM_BRAVO_20', 'BOM_BRAVO_30', 'BOM_BRAVO_40', 'BOM_BRAVO_50', 'BOM_BRAVO_60'] },
        { name: "Mando y Rescate", channels: ['BOM_MANDO_1', 'BOM_RESCATE_1', 'BOM_ESPECIAL_1', 'BOM_ESCALA_1', 'BOM_FORESTAL_1'] },
      ]
    },
    {
      name: "🚑 SUC",
      icon: <Ambulance className="h-4 w-4 text-orange-500" />,
      units: [
        { name: "Soporte Vital (SVB/SVA)", channels: ['SUC_SVB_01', 'SUC_SVB_02', 'SUC_SVB_03', 'SUC_SVB_04', 'SUC_SVB_05', 'SUC_SVA_01', 'SUC_SVA_02', 'SUC_SVA_03'] },
        { name: "Especiales", channels: ['SUC_SANITA_01', 'SUC_VIR_01', 'SUC_HEMS_01', 'SUC_COORD_01', 'SUC_GESTOR_01'] },
      ]
    }
  ];

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.map(cat => ({
      ...cat,
      units: cat.units.map(unit => ({
        ...unit,
        channels: unit.channels.filter(ch => ch.toLowerCase().includes(search.toLowerCase()))
      })).filter(unit => unit.channels.length > 0)
    })).filter(cat => cat.units.length > 0);
  }, [search]);

  const formatChannelName = (ch: string) => {
    return ch
      .replace(/^(CNP_|PL_|GC_|BOM_|SUC_)/, '')
      .replace(/_/g, '-')
      .toUpperCase();
  };

  const activeChannelData = useMemo(() => {
    if (!activeChannel) return null;
    for (const cat of categories) {
      for (const unit of cat.units) {
        if (unit.channels.includes(activeChannel)) {
          return { title: formatChannelName(activeChannel), category: cat.name, icon: cat.icon };
        }
      }
    }
    return { title: activeChannel, category: 'Personalizada', icon: <RadioIcon /> };
  }, [activeChannel]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Selector de Canales */}
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100 min-h-0">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar frecuencia..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[10px] font-bold uppercase border-slate-200 rounded-xl"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {filteredCategories.map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  {cat.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cat.name}</span>
                </div>
                <div className="space-y-0.5 px-1">
                  {cat.units.map((unit) => (
                    <div key={unit.name} className="space-y-0.5 mb-2">
                      <div className="px-2 py-1 text-[7px] font-bold text-slate-300 uppercase">{unit.name}</div>
                      {unit.channels.map((ch) => (
                        <button
                          key={ch}
                          onClick={() => onJoin(ch)}
                          className={cn(
                            "flex items-center justify-between px-3 py-1.5 w-full rounded-xl text-left transition-all",
                            activeChannel === ch ? "bg-primary text-white shadow-lg" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <span className="text-[9px] font-black uppercase truncate">{formatChannelName(ch)}</span>
                          {agents.filter(a => a.radio?.canalActual === ch).length > 0 && (
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Terminal de Radio */}
      <div className="flex-1 min-h-0">
        {activeChannel && activeChannelData ? (
          <RadioCard
            channel={activeChannel}
            title={activeChannelData.title}
            icon={activeChannelData.icon}
            active={true}
            onJoin={() => {}}
            onLeave={onLeave}
            users={agents.filter(a => a.radio?.canalActual === activeChannel)}
            wsStatus={wsStatus}
            isTransmitting={isTransmitting}
            onPTTStart={onPTTStart}
            onPTTStop={onPTTStop}
            onPTTToggle={onPTTToggle}
            isMobile={isMobile}
            isAdmin={isAdmin}
            onKick={onKick}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-40">
            <RadioIcon className="h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">En Espera</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Sintoniza un canal lateral para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}
