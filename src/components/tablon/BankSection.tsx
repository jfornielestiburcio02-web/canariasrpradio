
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, setDoc, updateDoc, increment, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Landmark, 
  Wallet, 
  TrendingUp, 
  History, 
  HandCoins, 
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Coins,
  FileText,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ArrowRightLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface Invoice {
  id: string;
  issuerId: string;
  receiverId: string;
  amount: number;
  concepto: string;
  estado: 'pendiente' | 'pagado' | 'anulado';
  createdAt: any;
}

interface Transaction {
  id: string;
  amount: number;
  tipo: string;
  descripcion: string;
  fecha: any;
}

export function BankSection({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading: userLoading } = useDoc<any>(doc(db, 'users', userId));
  
  // Préstamos
  const userEmpresasQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return collection(db, 'users', userId, 'empresas');
  }, [db, userId]);
  const { data: userEmpresas } = useCollection<any>(userEmpresasQuery);

  const [loanAmount, setLoanAmount] = useState('');
  const [loanMonths, setLoanMonths] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openLoan, setOpenLoan] = useState(false);

  // Facturas
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceReceiver, setInvoiceReceiver] = useState('');
  const [invoiceConcept, setInvoiceConcept] = useState('');
  const [isIssuingInvoice, setIsIssuingInvoice] = useState(false);
  const [isPayingInvoice, setIsPayingInvoice] = useState<string | null>(null);
  const [openInvoice, setOpenInvoice] = useState(false);

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

  // Facturas recibidas
  const receivedInvoicesQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'facturas'),
      where('receiverId', '==', userId),
      orderBy('id', 'desc')
    );
  }, [db, userId]);
  const { data: receivedInvoices } = useCollection<Invoice>(receivedInvoicesQuery);

  // Facturas emitidas
  const issuedInvoicesQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'facturas'),
      where('issuerId', '==', userId),
      orderBy('id', 'desc')
    );
  }, [db, userId]);
  const { data: issuedInvoices } = useCollection<Invoice>(issuedInvoicesQuery);

  // Historial de transacciones
  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'users', userId, 'transacciones'),
      orderBy('fecha', 'desc')
    );
  }, [db, userId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const handleCreateLoan = async () => {
    if (!db || !empresaId || !loanAmount) return;
    setIsSubmitting(true);
    const amount = Number(loanAmount);
    const interest = 0.05;
    const totalWithInterest = amount * (1 + interest);
    const months = Number(loanMonths);
    const loanId = Date.now().toString();

    try {
      const batch = writeBatch(db);
      
      // Crear préstamo
      batch.set(doc(db, 'empresas', empresaId, 'loans', loanId), {
        id: loanId,
        amount,
        totalWithInterest,
        monthlyPayment: totalWithInterest / months,
        months,
        paid: 0,
        status: 'aprobado',
        createdAt: serverTimestamp()
      });

      // Incrementar balance bancario
      batch.update(doc(db, 'users', userId), {
        'wallet.bankBalance': increment(amount)
      });

      // Registrar transacción
      const transId = `loan_${loanId}`;
      batch.set(doc(db, 'users', userId, 'transacciones', transId), {
        id: transId,
        amount,
        tipo: 'prestamo',
        descripcion: `Préstamo concedido de ${amount} 🪙`,
        fecha: serverTimestamp()
      });

      await batch.commit();
      
      toast({ title: "¡Crédito Concedido!", description: `${amount} 🪙 ingresados en tu cuenta.` });
      setOpenLoan(false);
      setLoanAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!db || !userId || !invoiceAmount || !invoiceReceiver) return;
    setIsIssuingInvoice(true);
    const invoiceId = Date.now().toString();

    try {
      await setDoc(doc(db, 'facturas', invoiceId), {
        id: invoiceId,
        issuerId: userId,
        receiverId: invoiceReceiver,
        amount: Number(invoiceAmount),
        concepto: invoiceConcept || 'Servicios marítimos',
        estado: 'pendiente',
        createdAt: serverTimestamp()
      });
      toast({ title: "Factura Emitida", description: `Has enviado una factura de ${invoiceAmount} 🪙.` });
      setOpenInvoice(false);
      setInvoiceAmount('');
      setInvoiceReceiver('');
      setInvoiceConcept('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsIssuingInvoice(false);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!db || !userId || !userData) return;
    
    const currentBankBalance = userData.wallet?.bankBalance || 0;
    if (currentBankBalance < invoice.amount) {
      toast({ 
        variant: "destructive", 
        title: "Saldo Insuficiente", 
        description: "No tienes suficientes doblones en el banco para pagar esta factura." 
      });
      return;
    }

    setIsPayingInvoice(invoice.id);

    try {
      const batch = writeBatch(db);

      // 1. Actualizar estado de la factura
      batch.update(doc(db, 'facturas', invoice.id), {
        estado: 'pagado'
      });

      // 2. Restar dinero al pagador
      batch.update(doc(db, 'users', userId), {
        'wallet.bankBalance': increment(-invoice.amount)
      });

      // 3. Sumar dinero al emisor
      batch.update(doc(db, 'users', invoice.issuerId), {
        'wallet.bankBalance': increment(invoice.amount)
      });

      // 4. Registrar transacción para el pagador
      const transIdPayer = `pay_${invoice.id}`;
      batch.set(doc(db, 'users', userId, 'transacciones', transIdPayer), {
        id: transIdPayer,
        amount: -invoice.amount,
        tipo: 'pago_factura',
        descripcion: `Pago de factura: ${invoice.concepto}`,
        fecha: serverTimestamp()
      });

      // 5. Registrar transacción para el emisor
      const transIdIssuer = `collect_${invoice.id}`;
      batch.set(doc(db, 'users', invoice.issuerId, 'transacciones', transIdIssuer), {
        id: transIdIssuer,
        amount: invoice.amount,
        tipo: 'cobro_factura',
        descripcion: `Cobro de factura: ${invoice.concepto}`,
        fecha: serverTimestamp()
      });

      await batch.commit();
      
      toast({ title: "Factura Pagada", description: `Has pagado ${invoice.amount} 🪙 por "${invoice.concepto}".` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el pago." });
    } finally {
      setIsPayingInvoice(null);
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
        
        <div className="flex gap-2">
          <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest h-10 px-6">
                <Send className="mr-2 h-4 w-4" /> Emitir Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl uppercase tracking-tight text-primary">Emitir Cobro</DialogTitle>
                <DialogDescription>Solicita un pago a otro ciudadano mediante una factura oficial.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID del Destinatario</Label>
                  <Input placeholder="ID de Discord" value={invoiceReceiver} onChange={(e) => setInvoiceReceiver(e.target.value)} className="bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Importe (🪙)</Label>
                  <Input type="number" placeholder="Ej: 500" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} className="bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Concepto</Label>
                  <Input placeholder="Ej: Reparación de Velamen" value={invoiceConcept} onChange={(e) => setInvoiceConcept(e.target.value)} className="bg-slate-50 border-none" />
                </div>
                <Button onClick={handleIssueInvoice} disabled={isIssuingInvoice || !invoiceAmount || !invoiceReceiver} className="w-full bg-primary font-bold uppercase tracking-widest h-12">
                  {isIssuingInvoice ? <Loader2 className="animate-spin" /> : 'Enviar Factura'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openLoan} onOpenChange={setOpenLoan}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> Solicitar Préstamo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl uppercase tracking-tight text-primary">Solicitud de Crédito</DialogTitle>
                <DialogDescription>El capital se ingresará inmediatamente en tu cuenta bancaria.</DialogDescription>
              </DialogHeader>
              {!empresaId ? (
                <div className="py-8 text-center space-y-4">
                  <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 px-4">No hemos detectado ninguna empresa vinculada. Debes formar parte de una organización.</p>
                </div>
              ) : (
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Importe (🪙)</Label>
                    <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="bg-slate-50 border-none h-12 text-lg font-bold" />
                  </div>
                  <Button onClick={handleCreateLoan} disabled={isSubmitting || !loanAmount || Number(loanAmount) <= 0} className="w-full bg-accent font-bold uppercase tracking-widest h-12">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar e Ingresar Dinero'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
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
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja de Ahorros</CardTitle>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Landmark className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{wallet.bankBalance.toLocaleString()} <span className="text-slate-300 text-xl font-normal">🪙</span></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prestamos" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 mb-6 rounded-lg w-full md:w-auto">
          <TabsTrigger value="prestamos" className="text-[10px] font-bold uppercase tracking-widest px-8">Préstamos</TabsTrigger>
          <TabsTrigger value="facturas" className="text-[10px] font-bold uppercase tracking-widest px-8">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="prestamos" className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <HandCoins className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">Créditos Activos</h3>
          </div>

          {loans && loans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map((loan) => (
                <Card key={loan.id} className="relative overflow-hidden border-none shadow-xl bg-white group">
                  <div className={`h-1.5 w-full ${loan.status === 'pagado' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PAGARÉ REAL DE CÁDIZ</p>
                        <CardTitle className="text-2xl font-bold text-primary">{loan.amount.toLocaleString()} <span className="text-slate-300 text-sm font-normal">🪙</span></CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 uppercase text-[8px] font-bold">
                        <ShieldCheck className="h-3 w-3 mr-1" /> {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Cuota Mensual</p>
                        <p className="text-xs font-bold">{loan.monthlyPayment.toLocaleString()} 🪙</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Devolver</p>
                        <p className="text-xs font-bold">{loan.totalWithInterest.toLocaleString()} 🪙</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress value={(loan.paid / loan.totalWithInterest) * 100} className="h-2 bg-slate-100" indicatorClassName="bg-amber-400" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{loan.paid.toLocaleString()} 🪙 pagados de {loan.totalWithInterest.toLocaleString()} 🪙</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center opacity-40 grayscale"><HandCoins className="h-12 w-12 mx-auto mb-4" /><p className="text-[10px] font-bold uppercase">Sin deudas activas</p></div>
          )}
        </TabsContent>

        <TabsContent value="facturas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">Facturas Recibidas</h3>
              </div>
              {receivedInvoices && receivedInvoices.length > 0 ? (
                receivedInvoices.map(inv => (
                  <Card key={inv.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><Receipt className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{inv.concepto}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">De: {inv.issuerId.substring(0, 10)}...</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="text-sm font-bold text-emerald-600">{inv.amount} 🪙</p>
                          <Badge variant="secondary" className={`text-[8px] font-bold uppercase mt-1 ${inv.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                            {inv.estado}
                          </Badge>
                        </div>
                        {inv.estado === 'pendiente' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePayInvoice(inv)} 
                            disabled={isPayingInvoice === inv.id}
                            className="h-7 text-[9px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700"
                          >
                            {isPayingInvoice === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pagar'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase">Sin facturas pendientes</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <ArrowUpRight className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">Facturas Emitidas</h3>
              </div>
              {issuedInvoices && issuedInvoices.length > 0 ? (
                issuedInvoices.map(inv => (
                  <Card key={inv.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><FileText className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{inv.concepto}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">A: {inv.receiverId.substring(0, 10)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{inv.amount} 🪙</p>
                        <Badge variant="outline" className={`text-[8px] font-bold uppercase mt-1 border-blue-100 text-blue-600 ${inv.estado === 'pagado' ? 'bg-blue-50' : ''}`}>
                          {inv.estado}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase">No has emitido cobros</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No hay movimientos bancarios registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
