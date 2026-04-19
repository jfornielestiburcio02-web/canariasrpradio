
'use client';

import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Landmark, Wallet, TrendingUp, History, HandCoins, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Loan {
  id: string;
  amount: number;
  totalWithInterest: number;
  monthlyPayment: number;
  months: number;
  paid: number;
  status: string;
  createdAt: any;
}

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading: userLoading } = useDoc<any>(doc(db, 'users', userId));

  const empresaId = userData?.empresaId;

  const loansQuery = useMemoFirebase(() => {
    if (!db || !empresaId) return null;
    return query(
      collection(db, 'empresas', empresaId, 'loans'),
      orderBy('createdAt', 'desc')
    );
  }, [db, empresaId]);

  const { data: loans, loading: loansLoading } = useCollection<Loan>(loansQuery);

  if (userLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const wallet = userData?.wallet || { balance: 0, bankBalance: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Caja de Ahorros de Cádiz</h2>
          <p className="text-xs text-slate-400">Estado de tus finanzas personales y depósitos bancarios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-sky-600 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Efectivo en Mano</CardTitle>
              <CardDescription>Doblones que llevas contigo actualmente.</CardDescription>
            </div>
            <div className="h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {wallet.balance.toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-indigo-600 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cuenta Bancaria</CardTitle>
              <CardDescription>Fondos seguros en el Banco Real.</CardDescription>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {wallet.bankBalance.toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-lg font-bold uppercase tracking-widest text-slate-700">Movimientos Recientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-40">
            <TrendingUp className="h-10 w-10 text-slate-300" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay transacciones registradas</p>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Préstamos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <HandCoins className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-700 uppercase tracking-widest">Préstamos Bancarios</h3>
        </div>

        {loansLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : loans && loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => {
              const progress = (loan.paid / loan.totalWithInterest) * 100;
              return (
                <Card key={loan.id} className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                  <div className={`h-1 w-full ${loan.status === 'pagado' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Crédito Empresarial</p>
                        <CardTitle className="text-xl font-bold text-slate-800">
                          {loan.amount.toLocaleString()} <span className="text-slate-300 text-sm font-normal">🪙</span>
                        </CardTitle>
                      </div>
                      <Badge variant={loan.status === 'pagado' ? 'secondary' : 'default'} className="text-[8px] font-bold uppercase">
                        {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-300 uppercase">Cuota Mensual</p>
                        <p className="text-xs font-bold text-slate-700">{loan.monthlyPayment.toFixed(2)} 🪙</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-300 uppercase">Plazo</p>
                        <p className="text-xs font-bold text-slate-700">{loan.months} Meses</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                        <span>Progreso de Pago</span>
                        <span>{loan.paid.toLocaleString()} / {loan.totalWithInterest.toLocaleString()}</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-slate-100" />
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                      <Calendar className="h-3 w-3 text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        Solicitado el {loan.createdAt?.seconds ? format(new Date(loan.createdAt.seconds * 1000), 'dd/MM/yyyy') : '---'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-none shadow-sm rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin préstamos activos</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1">
                {empresaId ? 'Tu empresa no tiene deudas pendientes con el banco.' : 'Debes estar vinculado a una empresa para solicitar créditos bancarios.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
