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
    updateDoc(docRef, { estado: newStatus }).catch(console.error);
  };

  const deleteCall = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'emergencyCalls', id)).catch(console.error);
  };

  if (loading) return null;

  return (
    <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden flex flex-col">
      <CardHeader className="py-3 px-4 shrink-0 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-800">Despachos Activos</CardTitle>
          </div>
          <Badge variant="outline" className="text-[8px] font-bold px-1.5 h-4">{calls.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200">
        {calls.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {calls.map((call) => (
              <div key={call.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[7px] font-black uppercase px-1 h-3.5",
                        call.estado === 'En proceso' ? 'bg-orange-500' : 
                        call.estado === 'Codigo 4' ? 'bg-emerald-500' : 'bg-slate-400'
                      )}>
                        {call.estado}
                      </Badge>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">
                        {call.createdAt ? format(call.createdAt.toDate(), 'HH:mm', { locale: es }) : '--:--'}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase truncate leading-tight">{call.motivo}</h4>
                  </div>
                  {isCoordinator && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      onClick={() => deleteCall(call.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                    <p className="text-[9px] font-bold text-slate-600 truncate uppercase tracking-tighter">{call.ubicacion}</p>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-tighter">{call.unidades.join(', ')}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-6 text-[7px] font-black uppercase flex-1 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600"
                    onClick={() => updateStatus(call.id, 'Codigo 4')}
                  >
                    CÓD. 4
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-6 text-[7px] font-black uppercase flex-1 border-slate-100 hover:bg-red-50 hover:text-red-600"
                    onClick={() => updateStatus(call.id, 'Cancelado')}
                  >
                    ANULAR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
            <Activity className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sin avisos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
