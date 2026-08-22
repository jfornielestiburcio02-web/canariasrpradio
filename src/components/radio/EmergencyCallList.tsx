
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Activity,
  MapPin,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmergencyCall {
  id: string;
  nombre: string;
  ubicacion: string;
  motivo: string;
  unidades: string[];
  estado: 'En proceso' | 'Codigo 4' | 'Cancelado';
  createdAt: any;
}

export function EmergencyCallList({ isCoordinator = false }: { isCoordinator?: boolean }) {
  const db = useFirestore();

  const callsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'emergencyCalls'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: calls, loading } = useCollection<EmergencyCall>(callsQuery);

  const updateStatus = async (id: string, newStatus: EmergencyCall['estado']) => {
    if (!db) return;
    const docRef = doc(db, 'emergencyCalls', id);
    await updateDoc(docRef, { estado: newStatus });
  };

  const deleteCall = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'emergencyCalls', id));
  };

  if (loading) return null;

  return (
    <Card className="bg-white border-none shadow-xl rounded-3xl overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4 shrink-0 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Despachos Activos</CardTitle>
          </div>
          <Badge variant="outline" className="text-[9px] font-bold">{calls.length} Avisos</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
        {calls.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {calls.map((call) => (
              <div key={call.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        call.estado === 'En proceso' ? 'bg-orange-500' : 
                        call.estado === 'Codigo 4' ? 'bg-emerald-500' : 'bg-slate-400'
                      )}>
                        {call.estado}
                      </Badge>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">
                        {call.createdAt ? format(call.createdAt.toDate(), 'HH:mm', { locale: es }) : '--:--'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase truncate">{call.motivo}</h4>
                  </div>
                  {isCoordinator && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => deleteCall(call.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-slate-300 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ubicación</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{call.ubicacion}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-3 w-3 text-slate-300 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Unidades</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{call.unidades.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-[8px] font-bold uppercase flex-1 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                    onClick={() => updateStatus(call.id, 'Codigo 4')}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Código 4
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-[8px] font-bold uppercase flex-1 border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={() => updateStatus(call.id, 'Cancelado')}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Activity className="h-10 w-10 text-slate-300 mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin avisos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
