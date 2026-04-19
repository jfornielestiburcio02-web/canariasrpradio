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
  CheckCircle2
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
  status: string;
  createdAt: any;
}

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading: userLoading } = useDoc<any>(doc(db, 'users', userId));
  
  // También buscamos en la subcolección de empresas para no fallar en la detección
  const userEmpresasQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return collection(db, 'users', userId, 'empresas');
  }, [db, userId]);
  const { data: userEmpresas } = useCollection<any>(userEmpresasQuery);

  const [loanAmount, setLoanAmount] = useState('');
  const [loanMonths, setLoanMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Intentamos obtener la empresa del usuario de varias fuentes
  const empresaId = useMemo(() => {
    if (userData?.empresaId) return userData.empresaId;
    if (userEmpresas && userEmpresas.length > 0) return userEmpresas[0].id;
    return null;
  }, [userData, userEmpresas]);

  const loansQuery = useMemoFirebase(() => {
    if (!db || !empresaId) return null;
    // Según tu JS: collection(db, 'empresas', companyId, 'loans')
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

      // 2. CONJUNTA CON ECONOMÍA: Actualizar el balance bancario del usuario inmediatamente
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
        description: "No se pudo procesar el préstamo. Contacta con el cabildo.",
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
                        <p className="text-xs font-bold text-slate-700">{loan.monthlyPayment?.toLocaleString()} 🪙</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Plazo</p>
                        <p className="text-xs font-bold text-slate-700">{loan.months} Meses</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                        <span>Progreso de Pago</span>
                        <span>{loan.paid.toLocaleString()} / {loan.totalWithInterest?.toLocaleString()}</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-slate-100" />
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
