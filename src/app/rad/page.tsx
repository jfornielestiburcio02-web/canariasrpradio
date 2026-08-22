
import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';

export default async function RadioPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  // 1. Comprobar rol estándar
  let authRol = { autorizado: false, mensaje: "" };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_rol?userId=${user.id}`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const text = await res.text();
      if (text) authRol = JSON.parse(text);
    }
  } catch (e) {}

  // 2. Comprobar rol 112
  let auth112 = { autorizado: false, mensaje: "" };
  try {
    const res = await fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const text = await res.text();
      if (text) auth112 = JSON.parse(text);
    }
  } catch (e) {}

  const isAuthorized = authRol.autorizado || auth112.autorizado;

  // Si no está autorizado como agente, mostramos la vista de emergencia para ciudadanos
  if (!isAuthorized) {
    return <CitizenEmergencyView discordUser={user} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage discordUser={user} is112={auth112.autorizado} />
    </div>
  );
}
