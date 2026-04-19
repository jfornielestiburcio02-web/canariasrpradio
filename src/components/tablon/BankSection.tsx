'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Landmark, 
  Wallet, 
  TrendingUp, 
  History, 
  HandCoins, 
  Calendar, 
  CreditCard,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
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
  
  const [loanAmount, setLoanAmount] = useState('');
  const [loanMonths, setLoanMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Intentamos obtener la empresa del usuario
  const empresaId = userData?.empresaId;

  const loansQuery = useMemoFirebase(() => {
    if (!db || !empresaId) return null;
    return query(
      collection(db, 'empresas', empresaId, 'loans'),
      orderBy('id', 'desc')
    );
  }, [db, empresaId]);

  const { data: loans, loading: loansLoading } = useCollection<Loan>(loansQuery);

  const handleCreateLoan = async () => {
    if (!db || !empresaId || !loanAmount) return;
    
    setIsSubmitting(true);
    const amount = Number(loanAmount);
    const months = Number(loanMonths);
    const interest = 0.05;
    const totalWithInterest = amount * (1 + interest);
    const monthlyPayment = totalWithInterest / months;
    const loanId = Date.now().toString();

    // Referencias
    const loanRef = doc(db, 'empresas', empresaId, 'loans', loanId);
    const userRef = doc(db, 'users', userId);
    
    const newLoan = {
      id: loanId,
      amount,
      totalWithInterest,
      monthlyPayment,
      months,
      paid: 0,
      status: 'pendiente',
      createdAt: serverTimestamp()
    };

    try {
      // 1. Crear el préstamo en la colección de la empresa
      await setDoc(loanRef, newLoan);

      // 2. CONJUNTA CON ECONOMÍA: Actualizar el balance bancario del usuario
      // Usamos increment para asegurar que la operación sea atómica en el servidor
      await updateDoc(userRef, {
        'wallet.bankBalance': increment(amount)
      });
      
      setIsSubmitting(false);
      setOpen(false);
      setLoanAmount('');
    } catch (err) {
      console.error("Error al tramitar el préstamo:", err);
      setIsSubmitting(false);
    }
  };

  if (userLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const wallet = userData?.wallet || { balance: 0, bankBalance: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Banco de Cádiz</h2>
          <p className="text-xs text-slate-400">Gestión de doblones, cuentas reales y créditos.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={!empresaId}
              className="bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Solicitar Préstamo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl uppercase tracking-tight text-primary">Solicitud de Crédito</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-body">
                El capital se ingresará inmediatamente en tu cuenta bancaria. 
                Se aplica un interés real del 5% sobre el total.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Importe a Solicitar (🪙)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="Ej: 10000" 
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="bg-slate-50 border-none h-12 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="months" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plazo de Devolución (Meses)</Label>
                <Input 
                  id="months" 
                  type="number" 
                  value={loanMonths}
                  onChange={(e) => setLoanMonths(e.target.value)}
                  className="bg-slate-50 border-none h-12"
                />
              </div>
              
              {loanAmount && (
                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-slate-400">Total con Intereses (5%):</span>
                    <span className="text-primary text-sm">{(Number(loanAmount) * 1.05).toLocaleString()} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-slate-400">Cuota Mensual Estimada:</span>
                    <span className="text-primary text-sm">{( (Number(loanAmount) * 1.05) / Number(loanMonths) ).toFixed(2)} 🪙</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateLoan} 
                disabled={isSubmitting || !loanAmount || Number(loanAmount) <= 0}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-widest h-12 text-xs"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar y Recibir Doblones'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!empresaId && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-xs text-amber-700 font-medium">
            Debes estar vinculado a una empresa para poder solicitar préstamos bancarios.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
          <div className="h-1 bg-sky-600 w-full transition-all group-hover:h-2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo en Mano</CardTitle>
              <CardDescription className="text-[10px]">Doblones físicos disponibles.</CardDescription>
            </div>
            <div className="h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {(wallet.balance || 0).toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
          <div className="h-1 bg-indigo-600 w-full transition-all group-hover:h-2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja de Ahorros</CardTitle>
              <CardDescription className="text-[10px]">Fondos seguros en el depósito real.</CardDescription>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {(wallet.bankBalance || 0).toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <HandCoins className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">Créditos Activos</h3>
        </div>

        {loansLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : loans && loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => {
              const progress = (loan.paid / (loan.totalWithInterest || 1)) * 100;
              return (
                <Card key={loan.id} className="bg-white border-none shadow-sm rounded-2xl overflow-hidden group">
                  <div className={`h-1.5 w-full ${loan.status === 'pagado' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contrato #{loan.id.substring(loan.id.length - 6)}</p>
                        <CardTitle className="text-2xl font-bold text-slate-800">
                          {loan.amount.toLocaleString()} <span className="text-slate-300 text-sm font-normal">🪙</span>
                        </CardTitle>
                      </div>
                      <Badge variant={loan.status === 'pagado' ? 'secondary' : 'default'} className="text-[8px] font-bold uppercase px-3 py-1">
                        {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Cuota Mensual</p>
                        <p className="text-xs font-bold text-slate-700">{loan.monthlyPayment?.toFixed(2) || '0.00'} 🪙</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Meses Totales</p>
                        <p className="text-xs font-bold text-slate-700">{loan.months} Meses</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                        <span>Estado de Pago</span>
                        <span>{loan.paid.toLocaleString()} / {loan.totalWithInterest?.toLocaleString()}</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-slate-100" />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {loan.createdAt ? format(new Date(loan.createdAt.seconds * 1000), 'dd MMM yyyy', { locale: es }) : '---'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[8px] border-slate-100 text-slate-400">CREDIT REAL</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-none shadow-sm rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <CreditCard className="h-10 w-10 text-slate-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin deudas registradas</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-2">
                No tienes préstamos pendientes. Puedes solicitar uno si estás vinculado a una empresa.
              </p>
            </div>
          </Card>
        )}
      </div>

      <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Historial de Operaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
            <TrendingUp className="h-10 w-10 text-slate-300" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay movimientos bancarios recientes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}