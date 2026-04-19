'use client';

import { useState } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Contact, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface DniData {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  imageUrl: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  razonRechazo?: string;
}

export function DniManager({ userId }: { userId: string }) {
  const db = useFirestore();
  const { data: userData, loading: profileLoading } = useDoc<any>(doc(db, 'users', userId));
  
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
    
    const userRef = doc(db, 'users', userId);
    setDoc(userRef, {
      dni: {
        ...formData,
        estado: 'pendiente',
        solicitadoEn: new Date(),
        createdAt: new Date()
      }
    }, { merge: true })
    .then(() => setLoading(false))
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
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

  const statusConfig = {
    pendiente: { icon: Clock, color: 'bg-orange-50 text-orange-600', label: 'En revisión' },
    aprobado: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', label: 'Aprobado' },
    rechazado: { icon: AlertCircle, color: 'bg-red-50 text-red-600', label: 'Rechazado' }
  };

  const config = statusConfig[dni.estado];

  return (
    <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden relative">
      <div className={`h-1 w-full ${dni.estado === 'aprobado' ? 'bg-emerald-500' : dni.estado === 'rechazado' ? 'bg-red-500' : 'bg-orange-400'}`} />
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold uppercase tracking-widest">Tu Documento de Identidad</CardTitle>
          <CardDescription>Estado de tu identificación oficial en la ciudad.</CardDescription>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color} text-[10px] font-bold uppercase tracking-wider`}>
          <config.icon className="h-3 w-3" />
          {config.label}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative h-48 w-40 rounded-lg overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 shrink-0">
            {dni.imageUrl ? (
              <Image src={dni.imageUrl} alt="Foto DNI" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-200"><Contact className="h-12 w-12" /></div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 flex-1">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Nombre Completo</p>
              <p className="text-sm font-bold text-slate-700">{dni.nombre} {dni.apellidos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Fecha de Nacimiento</p>
              <p className="text-sm font-bold text-slate-700">{dni.fechaNacimiento}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Nacionalidad</p>
              <p className="text-sm font-bold text-slate-700">Española (Cádiz)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">ID de Registro</p>
              <p className="text-xs font-mono text-slate-500 uppercase">{userId.substring(0, 12)}</p>
            </div>
          </div>
        </div>

        {dni.estado === 'rechazado' && dni.razonRechazo && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Motivo del rechazo:</p>
            <p className="text-xs text-red-600 italic">"{dni.razonRechazo}"</p>
            <Button 
              variant="outline" 
              className="mt-4 h-8 text-[10px] font-bold uppercase border-red-200 text-red-600 hover:bg-red-100"
              onClick={() => {
                const userRef = doc(db, 'users', userId);
                setDoc(userRef, { dni: null }, { merge: true });
              }}
            >
              Volver a intentar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}