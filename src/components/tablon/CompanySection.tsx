
'use client';

import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Briefcase, Users, Trophy, Activity, Calendar, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyData {
  id: string;
  nombre: string;
  ownerId: string;
  tipo: string;
  nivel: number;
  empleadosCapacity: number;
  empleados: string[];
  actividadRegistrada: number;
  createdAt: any;
}

export function CompanySection({ companyId }: { companyId: string }) {
  const db = useFirestore();
  const { data: company, loading } = useDoc<CompanyData>(doc(db, 'empresas', companyId));

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  if (!company) {
    return (
      <div className="p-12 text-center text-slate-400 italic">
        No se han podido cargar los datos de la empresa.
      </div>
    );
  }

  const employmentRate = (company.empleados.length / company.empleadosCapacity) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{company.nombre}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase tracking-wider text-blue-600 border-blue-100">
                {company.tipo}
              </Badge>
              <span className="text-slate-300 mx-1">•</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                <Calendar className="h-3 w-3" />
                Fundada en {company.createdAt ? format(new Date(company.createdAt.seconds * 1000), 'MMMM yyyy', { locale: es }) : '---'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-amber-400 w-full" />
          <CardHeader className="p-4 pb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nivel de Gremio</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold text-slate-800">Nivel {company.nivel}</div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Prestigio de la organización</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-sky-500 w-full" />
          <CardHeader className="p-4 pb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Personal</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-slate-800">{company.empleados.length} / {company.empleadosCapacity}</div>
              <Users className="h-5 w-5 text-sky-500" />
            </div>
            <Progress value={employmentRate} className="h-1.5 bg-slate-100" />
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Capacidad de empleados</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardHeader className="p-4 pb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actividad</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <div className="text-2xl font-bold text-slate-800">{company.actividadRegistrada}</div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Puntos de actividad semanal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <CardTitle className="text-lg font-bold uppercase tracking-widest text-slate-700">Lista de Personal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {company.empleados.map((empId, idx) => (
                <div key={empId} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {empId === company.ownerId ? 'Propietario' : 'Empleado'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">{empId.substring(0, 12)}</p>
                    </div>
                  </div>
                  {empId === company.ownerId && (
                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-bold">LÍDER</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              <CardTitle className="text-lg font-bold uppercase tracking-widest text-slate-700">Estatus Legal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Registro Mercantil:</p>
              <p className="text-xs text-emerald-600 font-medium">Esta organización está operando legalmente bajo los estatutos del Cabildo de Cádiz.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-300 uppercase">Licencia Comercial</p>
                <p className="text-xs font-bold text-slate-600">ACTIVA</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-300 uppercase">Última Auditoría</p>
                <p className="text-xs font-bold text-slate-600">HACE 3 DÍAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
