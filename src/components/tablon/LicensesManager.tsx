
'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ShieldCheck, AlertTriangle, Ship, Car, Crosshair } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LicenseData {
  tipo: string;
  puntos: number;
  expiresAt: any;
  createdAt: any;
  suspendidaHasta: any;
}

export function LicensesManager({ userId }: { userId: string }) {
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId);
  }, [db, userId]);

  const { data: userData, loading } = useDoc<any>(userRef);
  const [requesting, setRequesting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const licenseTypes = [
    { id: 'conducir', label: 'Conducir (Carros/Calesas)', icon: Car },
    { id: 'armas', label: 'Porte de Armas', icon: Crosshair },
    { id: 'navegar', label: 'Navegación Marítima', icon: Ship },
  ];

  const handleRequestLicense = () => {
    if (!selectedType || !db || !userId) return;
    setRequesting(true);
    
    setDoc(doc(db, 'users', userId), {
      [`licencia_${selectedType}`]: {
        tipo: selectedType,
        puntos: 10,
        createdAt: new Date(),
        expiresAt: null,
        suspendidaHasta: null
      }
    }, { merge: true })
    .then(() => {
      setRequesting(false);
      setSelectedType('');
    })
    .catch((err) => {
      console.error(err);
      setRequesting(false);
    });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>;

  const userLicenses = licenseTypes
    .map(t => userData?.[`licencia_${t.id}`] as LicenseData | undefined)
    .filter((l): l is LicenseData => !!l);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tus Licencias</h2>
          <p className="text-xs text-slate-400">Estado de tus permisos y habilitaciones oficiales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solicitud de nueva licencia */}
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden h-fit">
          <div className="h-1 bg-primary w-full" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold uppercase tracking-widest">Nueva Solicitud</CardTitle>
            </div>
            <CardDescription>Solicita una licencia al cabildo de la ciudad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Tipo de Licencia</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-slate-50 border-none h-11">
                  <SelectValue placeholder="Selecciona licencia" />
                </SelectTrigger>
                <SelectContent>
                  {licenseTypes
                    .filter(t => !userData?.[`licencia_${t.id}`])
                    .map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" /> {t.label}
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-[0.2em] h-12"
              disabled={!selectedType || requesting}
              onClick={handleRequestLicense}
            >
              {requesting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Tramitar Licencia'}
            </Button>
          </CardContent>
        </Card>

        {/* Listado de licencias actuales */}
        <div className="space-y-4">
          {userLicenses.length > 0 ? (
            userLicenses.map((lic) => {
              const typeConfig = licenseTypes.find(t => t.id === lic.tipo);
              const Icon = typeConfig?.icon || CreditCard;
              const isSuspended = lic.suspendidaHasta && new Date(lic.suspendidaHasta.seconds * 1000) > new Date();

              return (
                <Card key={lic.tipo} className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
                  <div className={`h-1 w-full ${isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isSuspended ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider truncate">
                          Licencia de {typeConfig?.label.split(' ')[0] || lic.tipo}
                        </h4>
                        <Badge variant={isSuspended ? 'destructive' : 'secondary'} className="text-[8px] font-bold uppercase tracking-tighter">
                          {isSuspended ? 'Suspendida' : 'Activa'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Puntos</span>
                          <span className={`text-sm font-bold ${lic.puntos <= 3 ? 'text-orange-500' : 'text-slate-700'}`}>{lic.puntos} / 10</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Expedición</span>
                          <span className="text-[10px] text-slate-500">
                            {lic.createdAt ? format(new Date(lic.createdAt.seconds * 1000), 'dd/MM/yyyy') : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  {isSuspended && (
                    <div className="bg-red-50 px-4 py-2 border-t border-red-100 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-[9px] font-bold text-red-700 uppercase">
                        Vuelve el {format(new Date(lic.suspendidaHasta.seconds * 1000), 'PP', { locale: es })}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="bg-slate-100/50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin licencias activas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
