
'use client';

import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, HeartPulse, ClipboardList, Calendar, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MedicalRecord {
  informacion: string;
  createdAt: any;
  updatedAt: any;
}

export function MedicalRecordSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading } = useDoc<any>(doc(db, 'users', userId));

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const ficha = userData?.fichamedica as MedicalRecord | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Ficha Médica Oficial</h2>
          <p className="text-xs text-slate-400">Expediente clínico custodiado por el Hospital del Puerto de Cádiz.</p>
        </div>
        <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-100">
          <HeartPulse className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {ficha ? (
          <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden relative">
            <div className="h-1.5 bg-red-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-red-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-600">Registro Clínico</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase">
                  <Calendar className="h-3 w-3" />
                  Última actualización: {ficha.updatedAt ? format(ficha.updatedAt.toDate(), 'PP', { locale: es }) : '---'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 min-h-[200px] relative">
                <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                  <Activity className="h-16 w-16 text-slate-900" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium italic">
                  "{ficha.informacion}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50/30 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-red-700 uppercase">Aviso Médico</p>
                    <p className="text-[10px] text-red-600 leading-tight">
                      Esta información es de carácter estrictamente confidencial y solo puede ser modificada por personal médico autorizado.
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <HeartPulse className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-700 uppercase">Estado General</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      No se han detectado anomalías graves en la última revisión física rutinaria.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-none shadow-sm rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <ClipboardList className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-700">Sin Expediente Médico</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                No tienes ninguna ficha médica registrada. Acude al hospital del puerto para que un médico realice tu revisión oficial.
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="text-center">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          Documento Certificado por la Real Junta de Sanidad de Cádiz
        </p>
      </div>
    </div>
  );
}
