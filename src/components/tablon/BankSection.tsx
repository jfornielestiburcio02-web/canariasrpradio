
'use client';

import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Landmark, 
  Wallet, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  tipo: string;
  descripcion: string;
  fecha: any;
}

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId);
  }, [db, userId]);

  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  const wallet = userData?.wallet || { balance: 0, bankBalance: 0 };

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'users', userId, 'transacciones'),
      orderBy('fecha', 'desc')
    );
  }, [db, userId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  if (userLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Banco de Cádiz</h2>
          <p className="text-xs text-slate-400">Gestión de doblones y movimientos reales en el puerto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
          <div className="h-1 bg-sky-600 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo en Mano</CardTitle>
            <div className="h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600"><Wallet className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{wallet.balance.toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
          <div className="h-1 bg-indigo-600 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo en Banco</CardTitle>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Landmark className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{wallet.bankBalance.toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Historial de Operaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions && transactions.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {transactions.map((trans) => (
                <div key={trans.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      trans.amount < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {trans.amount < 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{trans.descripcion}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {trans.fecha ? format(trans.fecha.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Cargando...'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${trans.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {trans.amount > 0 ? '+' : ''}{trans.amount.toLocaleString()} 🪙
                    </p>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-100 text-slate-400">
                      {trans.tipo}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <ArrowRightLeft className="h-10 w-10 text-slate-200" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No hay movimientos registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
