
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, FileText, Gavel, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface Antecedent {
  id: string;
  tipo: 'arresto' | 'multa';
  razon: string;
  imageUrl?: string;
  fechaRegistro: any;
  retirado: boolean;
}

export function AntecedentesSection({ userId }: { userId: string }) {
  const db = useFirestore();

  const antecedentesQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'users', userId, 'antecedentes'),
      orderBy('id', 'desc')
    );
  }, [db, userId]);

  const { data: antecedentes, loading } = useCollection<Antecedent>(antecedentesQuery);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Antecedentes Policiales</h2>
          <p className="text-xs text-slate-400">Registro oficial de arrestos y multas en la jurisdicción de Cádiz.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase tracking-wider">
            Total: {antecedentes?.length || 0}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {antecedentes && antecedentes.length > 0 ? (
          antecedentes.map((ant) => {
            const isArresto = ant.tipo === 'arresto';
            const isRetirado = ant.retirado;

            return (
              <Card key={ant.id} className={`bg-white border-none shadow-sm rounded-xl overflow-hidden ${isRetirado ? 'opacity-60' : ''}`}>
                <div className={`h-1 w-full ${isRetirado ? 'bg-emerald-400' : (isArresto ? 'bg-red-600' : 'bg-orange-500')}`} />
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Imagen si existe */}
                    {ant.imageUrl && (
                      <div className="relative w-full md:w-48 h-48 shrink-0 bg-slate-100 border-r border-slate-50">
                        <Image 
                          src={ant.imageUrl} 
                          alt="Evidencia" 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${isArresto ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                              {isArresto ? <Gavel className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Registro de {ant.tipo}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 leading-tight">
                            {ant.razon}
                          </h3>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={isRetirado ? 'secondary' : (isArresto ? 'destructive' : 'default')}
                            className="text-[9px] font-bold uppercase tracking-wider"
                          >
                            {isRetirado ? 'RETIRADO' : (isArresto ? 'ACTIVO' : 'PENDIENTE')}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-medium">
                            <Calendar className="h-3 w-3" />
                            {ant.fechaRegistro}
                          </div>
                        </div>
                      </div>

                      {isRetirado && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Este registro ha sido oficialmente retirado del expediente.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="bg-white border-none shadow-sm rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-700">Sin Antecedentes</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Tu historial está impecable. No se han encontrado registros policiales a tu nombre en los archivos de la ciudad.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
