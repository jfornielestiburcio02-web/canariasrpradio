
'use client';

import { RadioChannel } from '@/types/radio';
import { RadioCard } from './RadioCard';
import { Shield, Ambulance, Truck, Flame, Anchor, User } from 'lucide-react';

interface RadioGridProps {
  activeChannel: RadioChannel | null;
  onJoin: (channel: RadioChannel) => void;
  onLeave: () => void;
  peers: string[];
  connected: boolean;
  isTransmitting: boolean;
  onPTTStart: () => void;
  onPTTStop: () => void;
}

export function RadioGrid({
  activeChannel,
  onJoin,
  onLeave,
  peers,
  connected,
  isTransmitting,
  onPTTStart,
  onPTTStop
}: RadioGridProps) {
  const channels: { id: RadioChannel, title: string, icon: any }[] = [
    { id: 'SUC', title: 'SUC - Emergencias', icon: <Ambulance /> },
    { id: 'POLICIA_NACIONAL', title: 'Policía Nacional', icon: <Shield /> },
    { id: 'GUARDIA_CIVIL', title: 'Guardia Civil', icon: <Anchor /> },
    { id: 'POLICIA_LOCAL', title: 'Policía Local', icon: <User /> },
    { id: 'BOMBEROS', title: 'Bomberos', icon: <Flame /> },
    { id: 'TRANSPORTE', title: 'Transporte / Conser.', icon: <Truck /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {channels.map((ch) => (
        <RadioCard
          key={ch.id}
          channel={ch.id}
          title={ch.title}
          icon={ch.icon}
          active={activeChannel === ch.id}
          onJoin={() => onJoin(ch.id)}
          onLeave={onLeave}
          users={activeChannel === ch.id ? peers : []}
          connected={connected}
          isTransmitting={isTransmitting}
          onPTTStart={onPTTStart}
          onPTTStop={onPTTStop}
        />
      ))}
    </div>
  );
}
