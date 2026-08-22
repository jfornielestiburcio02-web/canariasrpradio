
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { RadioCard } from './RadioCard';
import { 
  Shield, Ambulance, Truck, Flame, Anchor, User, Zap, 
  Target, Users, Radio, Mountain, HeartPulse, Crosshair, Stethoscope,
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
      color: "border-blue-600",
      bg: "bg-blue-600/5",
      icon: <Shield className="h-4 w-4 text-blue-600" />,
      units: [
        { name: "Coordinación CNP", channels: ['CNP_COORD'] },
        { name: "Mando", channels: ['CNP_HOTEL_50'] },
        { name: "Seguridad Ciudadana", channels: ['CNP_ZETA_10', 'CNP_ZETA_20', 'CNP_ZETA_30', 'CNP_ZETA_40', 'CNP_ZETA_50', 'CNP_ZETA_60', 'CNP_ZETA_70', 'CNP_ZETA_80'] },
        { name: "UIP - Antidisturbios", channels: ['CNP_DRAGON_1', 'CNP_DRAGON_2', 'CNP_DRAGON_3', 'CNP_DRAGON_4'] },
        { name: "UPR - Reacción", channels: ['CNP_UPR_10', 'CNP_UPR_20', 'CNP_UPR_30', 'CNP_UPR_40', 'CNP_UPR_50'] },
        { name: "GEO - Operaciones", channels: ['CNP_GEO_1', 'CNP_GEO_2', 'CNP_GEO_3'] },
        { name: "Policía Judicial", channels: ['CNP_PJ_10', 'CNP_PJ_20', 'CNP_PJ_30', 'CNP_PJ_40'] },
        { name: "Información", channels: ['CNP_INFO_10', 'CNP_INFO_20', 'CNP_INFO_30'] },
        { name: "Extranjería", channels: ['CNP_FRONTERA_10', 'CNP_FRONTERA_20', 'CNP_FRONTERA_30'] },
        { name: "TEDAX-NRBQ", channels: ['CNP_TEDAX_1', 'CNP_TEDAX_2', 'CNP_TEDAX_3'] },
        { name: "TAC", channels: ['CNP_TAC_1', 'CNP_TAC_2', 'CNP_TAC_3'] },
      ]
    },
    {
      name: "👮 Policía Local",
      color: "border-sky-400",
      bg: "bg-sky-400/5",
      icon: <User className="h-4 w-4 text-sky-400" />,
      units: [
        { name: "Seguridad Ciudadana", channels: ['PL_POLICIA_10', 'PL_POLICIA_20', 'PL_POLICIA_30', 'PL_POLICIA_40', 'PL_POLICIA_50', 'PL_POLICIA_60', 'PL_POLICIA_70', 'PL_POLICIA_80'] },
        { name: "Motoristas", channels: ['PL_MOTO_10', 'PL_MOTO_20', 'PL_MOTO_30', 'PL_MOTO_40'] },
        { name: "Tráfico", channels: ['PL_TRAFICO_10', 'PL_TRAFICO_20', 'PL_TRAFICO_30', 'PL_TRAFICO_40'] },
        { name: "Atestados", channels: ['PL_ATESTA_1', 'PL_ATESTA_2', 'PL_ATESTA_3'] },
        { name: "Intervención", channels: ['PL_INTER_1', 'PL_INTER_2', 'PL_INTER_3'] },
        { name: "Unidad Canina", channels: ['PL_K9_1', 'PL_K9_2', 'PL_K9_3'] },
        { name: "Mando Local", channels: ['PL_MANDO_1', 'PL_MANDO_2', 'PL_MANDO_3'] },
      ]
    },
    {
      name: "🟢 Guardia Civil",
      color: "border-emerald-600",
      bg: "bg-emerald-600/5",
      icon: <Anchor className="h-4 w-4 text-emerald-600" />,
      units: [
        { name: "Seguridad Ciudadana", channels: ['GC_GUARDIA_10', 'GC_GUARDIA_20', 'GC_GUARDIA_30', 'GC_GUARDIA_40', 'GC_GUARDIA_50', 'GC_GUARDIA_60', 'GC_GUARDIA_70', 'GC_GUARDIA_80'] },
        { name: "Tráfico (ATGC)", channels: ['GC_TRAFICO_10', 'GC_TRAFICO_20', 'GC_TRAFICO_30', 'GC_TRAFICO_40', 'GC_TRAFICO_50'] },
        { name: "SEPRONA", channels: ['GC_SEPRONA_10', 'GC_SEPRONA_20', 'GC_SEPRONA_30', 'GC_SEPRONA_40'] },
        { name: "GEAS - Buceo", channels: ['GC_GEAS_1', 'GC_GEAS_2', 'GC_GEAS_3'] },
        { name: "Servicio Marítimo", channels: ['GC_MARITIMO_1', 'GC_MARITIMO_2', 'GC_MARITIMO_3'] },
        { name: "USECIC", channels: ['GC_USECIC_1', 'GC_USECIC_2', 'GC_USECIC_3'] },
        { name: "Aire / UHEL", channels: ['GC_UHEL_11', 'GC_AIRE_11'] },
        { name: "COS - Central", channels: ['GC_COS_1', 'GC_COS_2', 'GC_COS_3'] },
      ]
    },
    {
      name: "🚒 Bomberos",
      color: "border-red-600",
      bg: "bg-red-600/5",
      icon: <Flame className="h-4 w-4 text-red-600" />,
      units: [
        { name: "Extinción (Bravo)", channels: ['BOM_BRAVO_10', 'BOM_BRAVO_20', 'BOM_BRAVO_30', 'BOM_BRAVO_40', 'BOM_BRAVO_50', 'BOM_BRAVO_60'] },
        { name: "Mando Bomberos", channels: ['BOM_MANDO_1', 'BOM_MANDO_2', 'BOM_MANDO_3'] },
        { name: "Rescate", channels: ['BOM_RESCATE_1', 'BOM_RESCATE_2', 'BOM_RESCATE_3'] },
        { name: "Vehículos Especiales", channels: ['BOM_ESPECIAL_1', 'BOM_ESPECIAL_2', 'BOM_ESPECIAL_3'] },
        { name: "Auto-Escala", channels: ['BOM_ESCALA_1', 'BOM_ESCALA_2', 'BOM_ESCALA_3'] },
        { name: "Forestal", channels: ['BOM_FORESTAL_1', 'BOM_FORESTAL_2', 'BOM_FORESTAL_3'] },
      ]
    },
    {
      name: "🚑 SUC",
      color: "border-orange-500",
      bg: "bg-orange-500/5",
      icon: <Ambulance className="h-4 w-4 text-orange-500" />,
      units: [
        { name: "SVB (Básico)", channels: ['SUC_SVB_01', 'SUC_SVB_02', 'SUC_SVB_03', 'SUC_SVB_04', 'SUC_SVB_05', 'SUC_SVB_06', 'SUC_SVB_07', 'SUC_SVB_08', 'SUC_SVB_09', 'SUC_SVB_10'] },
        { name: "SVA (Avanzado)", channels: ['SUC_SVA_01', 'SUC_SVA_02', 'SUC_SVA_03', 'SUC_SVA_04', 'SUC_SVA_05'] },
        { name: "Sanitarizada", channels: ['SUC_SANITA_01', 'SUC_SANITA_02', 'SUC_SANITA_03', 'SUC_SANITA_04'] },
        { name: "VIR - Rápido", channels: ['SUC_VIR_01', 'SUC_VIR_02', 'SUC_VIR_03'] },
        { name: "HEMS - Aéreo", channels: ['SUC_HEMS_01'] },
        { name: "Coordinación", channels: ['SUC_COORD_01', 'SUC_COORD_02', 'SUC_COORD_03'] },
        { name: "Gestor Recursos", channels: ['SUC_GESTOR_01', 'SUC_GESTOR_02', 'SUC_GESTOR_03'] },
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
    // Especial para SUC, CNP, etc. para que se vea limpio
    return ch
      .replace(/^(CNP_|PL_|GC_|BOM_|SUC_)/, '')
      .replace(/_/g, '-')
      .replace(/POLICIA/g, 'Policía')
      .replace(/GUARDIA/g, 'Guardia')
      .replace(/SANITA/g, 'Sanitarizada')
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
    return { title: activeChannel, category: 'Desconocido', icon: <Radio /> };
  }, [activeChannel]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar de Frecuencias */}
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Explorador de Frecuencias</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar canal..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[10px] font-bold uppercase border-slate-200 bg-white rounded-xl"
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
                <div className="space-y-1">
                  {cat.units.map((unit) => (
                    <div key={unit.name} className="space-y-0.5">
                      <div className="px-3 py-1 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{unit.name}</div>
                      <div className="grid grid-cols-1 gap-0.5 px-2">
                        {unit.channels.map((ch) => (
                          <button
                            key={ch}
                            onClick={() => onJoin(ch)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group",
                              activeChannel === ch 
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <span className="text-[10px] font-black uppercase tracking-tight truncate">
                              {formatChannelName(ch)}
                            </span>
                            <div className="flex items-center gap-2">
                              {agents.filter(a => a.radio?.canalActual === ch).length > 0 && (
                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              )}
                              <ChevronRight className={cn("h-3 w-3", activeChannel === ch ? "text-white" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Terminal de Control */}
      <div className="flex-1 flex flex-col gap-6">
        {activeChannel && activeChannelData ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full">
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
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 opacity-40">
            <div className="bg-slate-50 p-8 rounded-full mb-6">
              <Radio className="h-16 w-16 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Terminal en Espera</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
              Selecciona una frecuencia del explorador lateral para sintonizar la red institucional.
            </p>
          </div>
        )}

        {/* Resumen de actividad */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl"><Shield className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Agentes CNP</p>
              <p className="text-sm font-black text-slate-800">{agents.filter(a => a.radio?.canalActual?.startsWith('CNP')).length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl"><Anchor className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Agentes GC</p>
              <p className="text-sm font-black text-slate-800">{agents.filter(a => a.radio?.canalActual?.startsWith('GC')).length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-xl"><Flame className="h-4 w-4 text-red-600" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bomberos</p>
              <p className="text-sm font-black text-slate-800">{agents.filter(a => a.radio?.canalActual?.startsWith('BOM')).length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-xl"><Ambulance className="h-4 w-4 text-orange-500" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Servicio SUC</p>
              <p className="text-sm font-black text-slate-800">{agents.filter(a => a.radio?.canalActual?.startsWith('SUC')).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
