
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Warn {
  id: string;
  moderador: string;
  razon: string;
  fecha: string;
  apelada: boolean;
  apelaRazon: string | null;
}

export function WarnsSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const [appealText, setAppealText] = useState<{ [key: string]: string }>({});

  const warnsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return collection(db, 'users', userId, 'warns');
  }, [db, userId]);

  const { data: warns, loading } = useCollection<Warn>(warnsQuery);

  const handleAppeal = (warnId: string) => {
    const reason = appealText[warnId];
    if (!reason || !userId) return;

    const warnRef = doc(db, 'users', userId, 'warns', warnId);
    updateDoc(warnRef, {
      apelada: true,
      apelaRazon: reason
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando registros de moderación...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Advertencias</h2>
          <p className="text-xs text-slate-400">Registro de sanciones y comportamiento en la ciudad.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle className="h-3 w-3" />
          Total: {warns?.length || 0}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {warns && warns.length > 0 ? (
          warns.map((warn) => (
            <Card key={warn.id} className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
              <div className={`h-1 w-full ${warn.apelada ? 'bg-amber-400' : 'bg-red-500'}`} />
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Moderador</p>
                    <span className="text-[10px] font-bold text-slate-700">{warn.moderador}</span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800">{warn.razon}</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-medium">
                  <Clock className="h-3 w-3" />
                  {warn.fecha ? format(new Date(Number(warn.id)), 'PPp', { locale: es }) : 'Fecha desconocida'}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {warn.apelada ? (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase mb-1">
                      <MessageSquare className="h-3 w-3" /> Apelación en proceso
                    </div>
                    <p className="text-xs text-amber-600 italic">"{warn.apelaRazon}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Apelar sanción</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Explica el motivo de tu apelación..."
                        className="text-xs h-8 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-amber-200"
                        value={appealText[warn.id] || ''}
                        onChange={(e) => setAppealText({ ...appealText, [warn.id]: e.target.value })}
                      />
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 hover:bg-amber-200"
                        onClick={() => handleAppeal(warn.id)}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-white border-none shadow-sm rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">¡Expediente Limpio!</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">No tienes ninguna advertencia registrada. ¡Sigue cumpliendo las leyes de la ciudad!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
