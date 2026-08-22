
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneIncoming, Shield, Loader2 } from 'lucide-react';

const FACTIONS = [
  { id: 'CNP', label: 'Cuerpo Nacional de Policía' },
  { id: 'GC', label: 'Guardia Civil' },
  { id: 'PL', label: 'Policía Local' },
  { id: 'BOM', label: 'Bomberos' },
  { id: 'SUC', label: 'SUC (Sanitarios)' },
  { id: 'CAR', label: 'Carreteras' },
];

export function EmergencyCallModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    motivo: '',
    unidades: [] as string[],
  });

  const db = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'emergencyCalls'), {
        ...formData,
        estado: 'En proceso',
        createdAt: serverTimestamp(),
        audioGenerated: false
      });
      setOpen(false);
      setFormData({ nombre: '', ubicacion: '', motivo: '', unidades: [] });
    } catch (error) {
      console.error('Error al registrar llamada:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaction = (faction: string) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.includes(faction)
        ? prev.unidades.filter(f => f !== faction)
        : [...prev.unidades, faction]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest gap-2 shadow-xl shadow-red-200">
          <PhoneIncoming className="h-4 w-4" /> Gestión de Llamadas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" /> Registro de Emergencia
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Nombre Solicitante</Label>
              <Input 
                required 
                value={formData.nombre} 
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="bg-slate-50 border-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Ubicación</Label>
              <Input 
                required 
                value={formData.ubicacion} 
                onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                className="bg-slate-50 border-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Motivo / Incidencia</Label>
              <Input 
                required 
                value={formData.motivo} 
                onChange={e => setFormData({...formData, motivo: e.target.value})}
                className="bg-slate-50 border-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Unidades Requeridas</Label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {FACTIONS.map(faction => (
                  <div key={faction.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={faction.id} 
                      checked={formData.unidades.includes(faction.id)}
                      onCheckedChange={() => toggleFaction(faction.id)}
                    />
                    <label htmlFor={faction.id} className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer">
                      {faction.id}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading || formData.unidades.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Emitir Aviso a Radios'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
