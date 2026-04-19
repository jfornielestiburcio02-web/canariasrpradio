
'use client';

import { useState, useMemo } from 'react';
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
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface Loan {
  id: string;
  amount: number;
  totalWithInterest: number;
  monthlyPayment: number;
  months: number;
  paid: number;
  status: 'pendiente' | 'aprobado' | 'pagado';
  createdAt: any;
}

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading: userLoading } = useDoc<any>(doc(db, 'users', userId));
  
  const userEmpresasQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return collection(db, 'users', userId, 'empresas');
  }, [db, userId]);
  const { data: userEmpresas } = useCollection<any>(userEmpresasQuery);

  const [loanAmount, setLoanAmount] = useState('');
  const [loanMonths, setLoanMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const empresaId = useMemo(() => {
    if (userData?.empresaId) return userData.empresaId;
    if (userEmpresas && userEmpresas.length > 0) return userEmpresas[0].id;
    return null;
  }, [userData, userEmpresas]);

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

    const loanRef = doc(db, 'empresas', empresaId, 'loans', loanId);
    const userRef = doc(db, 'users', userId);
    
    const newLoan = {
      id: loanId,
      amount,
      totalWithInterest,
      monthlyPayment,
      months,
      paid: 0,
      status: 'aprobado', // Lo ponemos como aprobado inmediatamente según tu lógica de "quien quiera"
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(loanRef, newLoan);
      await updateDoc(userRef, {
        'wallet.bankBalance': increment(amount)
      });
      
      toast({
        title: "¡Préstamo Concedido!",
        description: `Se han ingresado ${amount.toLocaleString()} 🪙 en tu cuenta bancaria.`,
      });

      setIsSubmitting(false);
      setOpen(false);
      setLoanAmount('');
    } catch (err) {
      console.error("Error al tramitar el préstamo:", err);
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el préstamo.",
      });
    }
  };

  if (userLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const wallet = userData?.wallet || { balance: 0, bankBalance: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Banco de Cádiz</h2>
          <p className="text-xs text-slate-400">Gestión de doblones y créditos reales.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
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
                Interés del 5% aplicado.
              </DialogDescription>
            </DialogHeader>
            
            {!empresaId ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-slate-600 px-4">
                  No hemos detectado ninguna empresa vinculada a tu perfil. 
                  Para solicitar un préstamo, debes formar parte de un gremio u organización.
                </p>
              </div>
            ) : (
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
                  <Label htmlFor="months" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plazo (Meses)</Label>
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
                      <span className="text-slate-400">Total a devolver:</span>
                      <span className="text-primary text-sm">{(Number(loanAmount) * 1.05).toLocaleString()} 🪙</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-slate-400">Cuota mensual:</span>
                      <span className="text-primary text-sm">{( (Number(loanAmount) * 1.05) / Number(loanMonths) ).toFixed(2)} 🪙</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleCreateLoan} 
                  disabled={isSubmitting || !loanAmount || Number(loanAmount) <= 0}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-widest h-12 text-xs"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar e Ingresar Dinero'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden group">
          <div className="h-1 bg-sky-600 w-full transition-all group-hover:h-2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo en Mano</CardTitle>
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
              const isApproved = loan.status === 'aprobado';
              const isPaid = loan.status === 'pagado';

              return (
                <Card 
                  key={loan.id} 
                  className={`border-none shadow-xl transition-all duration-500 overflow-hidden group ${
                    isApproved ? 'bg-gradient-to-br from-white to-amber-50/30 ring-2 ring-amber-400/20' : 'bg-white'
                  }`}
                >
                  <div className={`h-1.5 w-full ${isPaid ? 'bg-emerald-500' : isApproved ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  
                  {isApproved && (
                    <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
                      <ShieldCheck className="h-24 w-24 rotate-12" />
                    </div>
                  )}

                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {isApproved ? 'PAGARÉ REAL DE CÁDIZ' : `CONTRATO #${loan.id.substring(loan.id.length - 6)}`}
                        </p>
                        <CardTitle className={`text-2xl font-bold ${isApproved ? 'text-primary' : 'text-slate-800'}`}>
                          {loan.amount.toLocaleString()} <span className="text-slate-300 text-sm font-normal">🪙</span>
                        </CardTitle>
                      </div>
                      <Badge 
                        variant={isPaid ? 'secondary' : isApproved ? 'outline' : 'default'} 
                        className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                          isApproved ? 'bg-amber-50 text-amber-600 border-amber-200' : ''
                        }`}
                      >
                        {isPaid ? (
                          <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Pagado</div>
                        ) : isApproved ? (
                          <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Aprobado</div>
                        ) : (
                          <div className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Pendiente</div>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 space-y-5 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-xl ${isApproved ? 'bg-amber-50/50' : 'bg-slate-50'}`}>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Cuota Mensual</p>
                        <p className="text-xs font-bold text-slate-700">{loan.monthlyPayment?.toLocaleString()} 🪙</p>
                      </div>
                      <div className={`p-3 rounded-xl ${isApproved ? 'bg-amber-50/50' : 'bg-slate-50'}`}>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total Deuda</p>
                        <p className="text-xs font-bold text-slate-700">{loan.totalWithInterest?.toLocaleString()} 🪙</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400 px-1">
                        <span>Progreso de Pago</span>
                        <span className={isApproved ? 'text-amber-600' : ''}>
                          {loan.paid.toLocaleString()} 🪙 pagados
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2 ${isApproved ? 'bg-amber-100' : 'bg-slate-100'}`} 
                        indicatorClassName={isApproved ? 'bg-amber-400' : ''}
                      />
                    </div>

                    {isApproved && (
                      <div className="pt-3 border-t border-amber-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-600/60">
                          <Coins className="h-3 w-3" />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Fondo del Reino</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                          Vencimiento en {loan.months} meses
                        </span>
                      </div>
                    )}
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
                Solicita un crédito para impulsar tus negocios en el puerto.
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
