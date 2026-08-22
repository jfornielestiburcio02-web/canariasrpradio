
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { RadioCard } from './RadioCard';
import { Shield, Ambulance, Truck, Flame, Anchor, User, Zap, Target, Users, Radio } from 'lucide-react';

interface RadioGridProps {
  activeChannel: RadioChannel | null;
  onJoin: (channel: RadioChannel) => void;
  onLeave: () => void;
  peers: string[];
  wsStatus: WSStatus;
  isTransmitting: boolean;
  onPTTStart: () => void;
  onPTTStop: () => void;
}

export function RadioGrid({
  activeChannel,
  onJoin,
  onLeave,
  peers,
  wsStatus,
  isTransmitting,
  onPTTStart,
  onPTTStop
}: RadioGridProps) {
  
  const categories = [
    {
      name: "Frecuencias Generales",
      icon: <Radio className="h-4 w-4" />,
      channels: [
        { id: 'SUC', title: 'SUC - Emergencias', icon: <Ambulance /> },
        { id: 'POLICIA_NACIONAL', title: 'CNP - General', icon: <Shield /> },
        { id: 'GUARDIA_CIVIL', title: 'Guardia Civil', icon: <Anchor /> },
        { id: 'POLICIA_LOCAL', title: 'Policía Local', icon: <User /> },
        { id: 'BOMBEROS', title: 'Bomberos', icon: <Flame /> },
        { id: 'TRANSPORTE', title: 'Transporte / Conser.', icon: <Truck /> },
      ]
    },
    {
      name: "Tácticas CNP",
      icon: <Target className="h-4 w-4" />,
      channels: [
        { id: 'CNP_TACTICA_1', title: 'CNP - Táctica 1', icon: <Zap /> },
        { id: 'CNP_TACTICA_2', title: 'CNP - Táctica 2', icon: <Zap /> },
        { id: 'CNP_TACTICA_3', title: 'CNP - Táctica 3', icon: <Zap /> },
      ]
    },
    {
      name: "GAC - Grupo de Atención Ciudadana",
      icon: <Shield className="h-4 w-4" />,
      channels: [
        { id: 'CNP_GAC_ZETA_10', title: 'GAC - Zeta 10', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_20', title: 'GAC - Zeta 20', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_25', title: 'GAC - Zeta 25', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_30', title: 'GAC - Zeta 30', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_35', title: 'GAC - Zeta 35', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_45', title: 'GAC - Zeta 45', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_50', title: 'GAC - Zeta 50', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_55', title: 'GAC - Zeta 55', icon: <Shield /> },
        { id: 'CNP_GAC_ZETA_60', title: 'GAC - Zeta 60', icon: <Shield /> },
        { id: 'CNP_GAC_INTERCEPTORA', title: 'GAC - Interceptora', icon: <Zap /> },
      ]
    },
    {
      name: "UPR - Unidad de Prevención y Reacción",
      icon: <Users className="h-4 w-4" />,
      channels: [
        { id: 'CNP_UPR_FENIX_10', title: 'UPR - Fenix 10', icon: <Zap /> },
        { id: 'CNP_UPR_FENIX_20', title: 'UPR - Fenix 20', icon: <Zap /> },
        { id: 'CNP_UPR_FENIX_30', title: 'UPR - Fenix 30', icon: <Zap /> },
      ]
    },
    {
      name: "UIP - Unidad de Intervención Policial",
      icon: <Users className="h-4 w-4" />,
      channels: [
        { id: 'CNP_UIP_LOBO_10', title: 'UIP - Lobo 10', icon: <Zap /> },
        { id: 'CNP_UIP_LOBO_20', title: 'UIP - Lobo 20', icon: <Zap /> },
        { id: 'CNP_UIP_LOBO_30', title: 'UIP - Lobo 30', icon: <Zap /> },
      ]
    },
    {
      name: "GEO - Grupo Especial de Operaciones",
      icon: <Target className="h-4 w-4" />,
      channels: [
        { id: 'CNP_GEO_BRAVO_10', title: 'GEO - Bravo 10', icon: <Target /> },
        { id: 'CNP_GEO_BRAVO_20', title: 'GEO - Bravo 20', icon: <Target /> },
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      {categories.map((cat, idx) => (
        <div key={idx} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              {cat.icon}
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              {cat.name}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cat.channels.map((ch) => (
              <RadioCard
                key={ch.id}
                channel={ch.id as RadioChannel}
                title={ch.title}
                icon={ch.icon}
                active={activeChannel === ch.id}
                onJoin={() => onJoin(ch.id as RadioChannel)}
                onLeave={onLeave}
                users={activeChannel === ch.id ? peers : []}
                wsStatus={wsStatus}
                isTransmitting={isTransmitting}
                onPTTStart={onPTTStart}
                onPTTStop={onPTTStop}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
