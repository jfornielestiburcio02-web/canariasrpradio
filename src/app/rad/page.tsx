
import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function RadioPage() {
  const user = await getSessionUser();

  // Verificación de sesión de servidor para máxima seguridad
  if (!user) {
    redirect('/');
  }

  // Comprobar permisos en el endpoint externo proporcionado por el usuario
  let authStatus = { autorizado: false, mensaje: "Verificando credenciales..." };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_rol?userId=${user.id}`, {
      cache: 'no-store'
    });
    
    if (res.ok) {
      const text = await res.text();
      if (text) {
        authStatus = JSON.parse(text);
      } else {
        authStatus = { autorizado: false, mensaje: "El servidor de roles devolvió una respuesta vacía." };
      }
    } else {
      authStatus = { autorizado: false, mensaje: "El servicio de validación no respondió correctamente." };
    }
  } catch (error) {
    console.error("Role Check Error:", error);
    authStatus = { autorizado: false, mensaje: "No se pudo establecer conexión con el centro de mando (API)." };
  }

  // Si el acceso es denegado, mostramos una pantalla de error en lugar de la radio
  if (!authStatus.autorizado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white overflow-hidden">
          <div className="h-2 bg-destructive w-full" />
          <CardHeader className="text-center pt-10 px-8">
            <div className="flex justify-center mb-6">
              <div className="bg-destructive/10 p-5 rounded-full ring-8 ring-destructive/5">
                <ShieldAlert className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
              Acceso Restringido
            </CardTitle>
            <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em] mt-2">
              Error de Autorización
            </p>
          </CardHeader>
          
          <CardContent className="text-center space-y-8 px-10 pb-12 pt-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "{authStatus.mensaje}"
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all active:scale-[0.98]">
                <Link href="/inicio_desde_menu" className="flex items-center justify-center gap-3">
                  <ArrowLeft className="h-4 w-4" /> 
                  <span className="text-xs font-bold uppercase tracking-widest">Volver al Menú</span>
                </Link>
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em] leading-relaxed">
                Tenerife RP • Seguridad Institucional
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage discordUser={user} />
    </div>
  );
}
