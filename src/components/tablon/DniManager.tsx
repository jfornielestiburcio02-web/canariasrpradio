
'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Contact, CheckCircle2, Clock, AlertCircle, ShieldCheck, Anchor } from 'lucide-react';
import Image from 'next/image';

interface DniData {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  imageUrl: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  razonRechazo?: string;
  solicitadoEn?: any;
}

export function DniManager({ userId }: { userId: string }) {
  const db = useFirestore();
  
  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId);
  }, [db, userId]);

  const { data: userData, loading: profileLoading } = useDoc<any>(userRef);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    fechaNacimiento: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (db && userId) {
      setDoc(doc(db, 'users', userId), {
        dni: {
          ...formData,
          estado: 'pendiente',
          solicitadoEn: serverTimestamp(),
        }
      }, { merge: true })
      .then(() => setLoading(false))
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
    }
  };

  if (profileLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>;

  const dni = userData?.dni as DniData | undefined;

  if (!dni) {
    return (
      <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <Contact className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold uppercase tracking-widest">Solicitud de DNI</CardTitle>
          </div>
          <CardDescription>Parece que aún no tienes un documento de identidad registrado en el puerto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre</Label>
                <Input 
                  id="nombre" 
                  required 
                  className="bg-slate-50 border-none h-11"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Apellidos</Label>
                <Input 
                  id="apellidos" 
                  required 
                  className="bg-slate-50 border-none h-11"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nacimiento" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha de Nacimiento</Label>
                <Input 
                  id="nacimiento" 
                  type="date" 
                  required 
                  className="bg-slate-50 border-none h-11"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">URL de Fotografía</Label>
                <Input 
                  id="foto" 
                  placeholder="https://..." 
                  required 
                  className="bg-slate-50 border-none h-11"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-[0.2em] h-12 mt-4"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Solicitar Documento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const isApproved = dni.estado === 'aprobado';

  return (
    <Card className={`relative overflow-hidden border-none shadow-xl transition-all duration-500 ${isApproved ? 'bg-gradient-to-br from-white to-slate-50 ring-2 ring-amber-400/30' : 'bg-white'}`}>
      {/* Indicador de estado superior */}
      <div className={`h-1.5 w-full ${dni.estado === 'aprobado' ? 'bg-amber-400' : dni.estado === 'rechazado' ? 'bg-red-500' : 'bg-orange-400'}`} />
      
      {isApproved && (
        <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
          <Anchor className="h-32 w-32 rotate-12" />
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${isApproved ? 'text-amber-500' : 'text-slate-400'}`} />
            <CardTitle className="text-lg font-bold uppercase tracking-widest text-slate-800">
              {isApproved ? 'PASAPORTE REAL DE CÁDIZ' : 'DOCUMENTO DE IDENTIDAD'}
            </CardTitle>
          </div>
          <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">
            {isApproved ? 'Ciudadano Oficial del Reino' : 'Estado de identificación oficial'}
          </CardDescription>
        </div>
        
        <Badge 
          variant={isApproved ? 'outline' : 'secondary'}
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
            dni.estado === 'aprobado' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
            dni.estado === 'rechazado' ? 'bg-red-50 text-red-600 border-red-100' : 
            'bg-orange-50 text-orange-600 border-orange-100'
          }`}
        >
          {dni.estado === 'aprobado' ? (
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Aprobado</div>
          ) : dni.estado === 'rechazado' ? (
            <div className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Rechazado</div>
          ) : (
            <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Pendiente</div>
          )}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className={`relative h-52 w-44 rounded-lg overflow-hidden border-4 ${isApproved ? 'border-amber-100' : 'border-slate-100'} shadow-lg bg-slate-50 shrink-0`}>
            {dni.imageUrl ? (
              <Image src={dni.imageUrl} alt="Foto DNI" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-200"><Contact className="h-12 w-12" /></div>
            )}
            {isApproved && (
              <div className="absolute bottom-0 w-full bg-amber-400/90 py-1 text-center">
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">Sello Real</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 flex-1">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nombre Completo</p>
              <p className={`text-base font-bold ${isApproved ? 'text-primary' : 'text-slate-700'}`}>{dni.nombre} {dni.apellidos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fecha de Nacimiento</p>
              <p className="text-base font-bold text-slate-700">{dni.fechaNacimiento}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nacionalidad / Origen</p>
              <p className="text-base font-bold text-slate-700">Española (Cádiz)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Número de Registro</p>
              <p className="text-xs font-mono text-slate-500 uppercase font-bold">{userId.substring(0, 14)}</p>
            </div>
          </div>
        </div>

        {dni.estado === 'rechazado' && dni.razonRechazo && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
            <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Motivo del rechazo:</p>
            <p className="text-xs text-red-600 italic">"{dni.razonRechazo}"</p>
            <Button 
              variant="outline" 
              className="mt-4 h-8 text-[10px] font-bold uppercase border-red-200 text-red-600 hover:bg-red-100"
              onClick={() => {
                if (db && userId) {
                  const userRef = doc(db, 'users', userId);
                  setDoc(userRef, { dni: null }, { merge: true });
                }
              }}
            >
              Nueva Solicitud
            </Button>
          </div>
        )}

        {isApproved && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-300 uppercase">Emisión</span>
                <span className="text-[10px] font-bold text-slate-500">Cádiz, Reino de España</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-slate-300 uppercase">Validez</span>
                <span className="text-[10px] font-bold text-emerald-600">PERMANENTE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Anchor className="h-4 w-4" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Puerto de Cádiz</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
