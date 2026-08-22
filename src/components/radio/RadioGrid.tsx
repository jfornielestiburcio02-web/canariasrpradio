
'use client';

import { RadioChannel, WSStatus } from '@/types/radio';
import { RadioCard } from './RadioCard';
import { Shield, Ambulance, Truck, Flame, Anchor, User, Zap, Target, Users, Radio, Mountain, HeartPulse, Crosshair, Stethoscope, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const cnpCategories = [
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

  const gcCategories = [
    {
      name: "GC - Asignaciones y Coordinación",
      icon: <Anchor className="h-4 w-4" />,
      channels: [
        { id: 'GC_ESP_ASIGN', title: 'GC - Esp. Asign', icon: <Shield /> },
        { id: 'GC_COS', title: 'COS - Centro Operativo', icon: <Radio /> },
        { id: 'GC_COTA', title: 'COTA - Tráfico', icon: <Radio /> },
      ]
    },
    {
      name: "GC - Supervisión y Seguridad Ciudadana",
      icon: <Shield className="h-4 w-4" />,
      channels: [
        { id: 'GC_M620_JS', title: 'GC - M-620-JS', icon: <Shield /> },
        { id: 'GC_M620_A', title: 'SC - M-620-A', icon: <Shield /> },
        { id: 'GC_M620_B', title: 'SC - M-620-B', icon: <Shield /> },
        { id: 'GC_M620_C', title: 'SC - M-620-C', icon: <Shield /> },
        { id: 'GC_M620_D', title: 'SC - M-620-D', icon: <Shield /> },
        { id: 'GC_M620_E', title: 'SC - M-620-E', icon: <Shield /> },
      ]
    },
    {
      name: "GC - Agrupación de Tráfico (ATGC)",
      icon: <Truck className="h-4 w-4" />,
      channels: [
        { id: 'GC_M324', title: 'ATGC - M-324', icon: <Zap /> },
        { id: 'GC_M325', title: 'ATGC - M-325', icon: <Zap /> },
        { id: 'GC_M326', title: 'ATGC - M-326', icon: <Zap /> },
        { id: 'GC_M327', title: 'ATGC - M-327', icon: <Zap /> },
      ]
    },
    {
      name: "GC - GRS (Grupo de Reserva y Seguridad)",
      icon: <Users className="h-4 w-4" />,
      channels: [
        { id: 'GC_PUMA_0', title: 'GRS - Puma 0 (Jefe)', icon: <Target /> },
        { id: 'GC_PUMA_10', title: 'GRS - Puma 10', icon: <Shield /> },
        { id: 'GC_PUMA_20', title: 'GRS - Puma 20', icon: <Shield /> },
      ]
    },
    {
      name: "GC - USECIC (Seguridad Ciudadana Comandancia)",
      icon: <Shield className="h-4 w-4" />,
      channels: [
        { id: 'GC_LOBO_0', title: 'USECIC - Lobo 0 (Jefe)', icon: <Target /> },
        { id: 'GC_LOBO_10', title: 'USECIC - Lobo 10', icon: <Shield /> },
        { id: 'GC_LOBO_20', title: 'USECIC - Lobo 20', icon: <Shield /> },
      ]
    },
    {
      name: "GC - GREIM (Rescate e Intervención en Montaña)",
      icon: <Mountain className="h-4 w-4" />,
      channels: [
        { id: 'GC_M680', title: 'GREIM - M-680', icon: <Shield /> },
        { id: 'GC_M681', title: 'GREIM - M-681', icon: <Shield /> },
      ]
    }
  ];

  const bomberosCategories = [
    {
      name: "Bomberos - Coordinación y Asignación",
      icon: <Flame className="h-4 w-4" />,
      channels: [
        { id: 'BOM_SIN_ASIGN', title: 'Sin Asignación', icon: <Flame /> },
        { id: 'BOM_CUB', title: 'CUB - Coordinadora Unitaria', icon: <Radio /> },
      ]
    },
    {
      name: "BUP - Bomba Urbana Pesada",
      icon: <Flame className="h-4 w-4" />,
      channels: [
        { id: 'BOM_BUP_BRAVO_10', title: 'BRAVO - 10', icon: <Flame /> },
        { id: 'BOM_BUP_BRAVO_20', title: 'BRAVO - 20', icon: <Flame /> },
        { id: 'BOM_BUP_BRAVO_30', title: 'BRAVO - 30', icon: <Flame /> },
      ]
    },
    {
      name: "AEA - Auto Escalera Automatica",
      icon: <Flame className="h-4 w-4" />,
      channels: [
        { id: 'BOM_AEA_ALPHA_10', title: 'ALPHA - 10', icon: <Flame /> },
        { id: 'BOM_AEA_ALPHA_20', title: 'ALPHA - 20', icon: <Flame /> },
        { id: 'BOM_AEA_ALPHA_30', title: 'ALPHA - 30', icon: <Flame /> },
      ]
    },
    {
      name: "SE - Sector Sanitario",
      icon: <HeartPulse className="h-4 w-4" />,
      channels: [
        { id: 'BOM_SE_NOVEMBER_10', title: 'NOVEMBER - 10', icon: <HeartPulse /> },
        { id: 'BOM_SE_NOVEMBER_20', title: 'NOVEMBER - 20', icon: <HeartPulse /> },
        { id: 'BOM_SE_NOVEMBER_30', title: 'NOVEMBER - 30', icon: <HeartPulse /> },
      ]
    }
  ];

  const sucCategories = [
    {
      name: "SUC - Coordinación y Hospital",
      icon: <HeartPulse className="h-4 w-4" />,
      channels: [
        { id: 'SUC_SIN_ASIGN', title: 'Sin Asignación', icon: <HeartPulse /> },
        { id: 'SUC_CCS', title: 'CCS - Central Coordinación', icon: <Radio /> },
        { id: 'SUC_HOSPITAL', title: 'Hospital', icon: <Mountain /> },
      ]
    },
    {
      name: "SVB | Soporte Vital Básico",
      icon: <Ambulance className="h-4 w-4" />,
      channels: [
        { id: 'SUC_SVB_ALPHA_10', title: 'ALPHA - 10', icon: <Ambulance /> },
        { id: 'SUC_SVB_ALPHA_20', title: 'ALPHA - 20', icon: <Ambulance /> },
        { id: 'SUC_SVB_ALPHA_30', title: 'ALPHA - 30', icon: <Ambulance /> },
      ]
    },
    {
      name: "SVA | Soporte Vital Avanzado",
      icon: <Stethoscope className="h-4 w-4" />,
      channels: [
        { id: 'SUC_SVA_BRAVO_10', title: 'BRAVO - 10', icon: <Stethoscope /> },
        { id: 'SUC_SVA_BRAVO_20', title: 'BRAVO - 20', icon: <Stethoscope /> },
        { id: 'SUC_SVA_BRAVO_30', title: 'BRAVO - 30', icon: <Stethoscope /> },
      ]
    },
    {
      name: "VIR | Vehículo de Intervención Rápida",
      icon: <Zap className="h-4 w-4" />,
      channels: [
        { id: 'SUC_VIR_DELTA_10', title: 'DELTA - 10', icon: <Zap /> },
        { id: 'SUC_VIR_DELTA_20', title: 'DELTA - 20', icon: <Zap /> },
        { id: 'SUC_VIR_DELTA_30', title: 'DELTA - 30', icon: <Zap /> },
      ]
    }
  ];

  const carreteraCategories = [
    {
      name: "Conservación de Carreteras",
      icon: <Truck className="h-4 w-4" />,
      channels: [
        { id: 'CAR_SIN_ASIGN', title: 'Esperando asignación', icon: <Truck /> },
        { id: 'CAR_COORDINACION', title: 'Radio Coordinación', icon: <Radio /> },
      ]
    }
  ];

  const renderCategory = (cat: any) => (
    <div key={cat.name} className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          {cat.icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
          {cat.name}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cat.channels.map((ch: any) => (
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
  );

  return (
    <div className="space-y-12 pb-20">
      {/* SECCIÓN CNP */}
      <div className="space-y-12">
        {cnpCategories.map(renderCategory)}
      </div>

      {/* SEPARADOR GRANDE GUARDIA CIVIL */}
      <div className="pt-16 pb-8 border-t-4 border-emerald-500/20">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-xl ring-4 ring-emerald-50">
            <Anchor className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Guardia Civil</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="h-px w-10 bg-emerald-200" />
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em]">Benemérita - Tenerife RP</p>
              <span className="h-px w-10 bg-emerald-200" />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN GC */}
      <div className="space-y-12">
        {gcCategories.map(renderCategory)}
      </div>

      {/* SEPARADOR GRANDE BOMBEROS */}
      <div className="pt-16 pb-8 border-t-4 border-red-500/20">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-4 rounded-2xl shadow-xl ring-4 ring-red-50">
            <Flame className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Bomberos Tenerife</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="h-px w-10 bg-red-200" />
              <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.3em]">Consorcio de Bomberos - Tenerife RP</p>
              <span className="h-px w-10 bg-red-200" />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN BOMBEROS */}
      <div className="space-y-12">
        {bomberosCategories.map(renderCategory)}
      </div>

      {/* SEPARADOR GRANDE SUC */}
      <div className="pt-16 pb-8 border-t-4 border-amber-500/20">
        <div className="flex items-center gap-5">
          <div className="bg-amber-500 p-4 rounded-2xl shadow-xl ring-4 ring-amber-50">
            <HeartPulse className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Servicio de Urgencias Canario</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="h-px w-10 bg-amber-200" />
              <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em]">SUC - Tenerife RP</p>
              <span className="h-px w-10 bg-amber-200" />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN SUC */}
      <div className="space-y-12">
        {sucCategories.map(renderCategory)}
      </div>

      {/* SEPARADOR GRANDE CONSERVACIÓN DE CARRETERAS */}
      <div className="pt-16 pb-8 border-t-4 border-slate-500/20">
        <div className="flex items-center gap-5">
          <div className="bg-slate-700 p-4 rounded-2xl shadow-xl ring-4 ring-slate-50">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Conservación de Carreteras</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="h-px w-10 bg-slate-200" />
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Mantenimiento Vial - Tenerife RP</p>
              <span className="h-px w-10 bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN CARRETERAS */}
      <div className="space-y-12">
        {carreteraCategories.map(renderCategory)}
      </div>
    </div>
  );
}
