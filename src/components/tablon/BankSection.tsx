
'use client';

import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Landmark, Wallet, TrendingUp, History } from 'lucide-react';

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading } = useDoc<any>(doc(db, 'users', userId));

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

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
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
            <TrendingUp className="h-10 w-10 text-slate-300" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay transacciones registradas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
