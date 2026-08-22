
import { getSessionUser } from '@/app/lib/auth-utils';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';

export default async function RadioPage() {
  const user = await getSessionUser();

  // 1. Comprobar roles solo si el usuario está autenticado
  let authRol = { autorizado: false, mensaje: "" };
  let auth112 = { autorizado: false, mensaje: "" };

  if (user) {
    try {
      // Nueva validación de rol de agente según requerimiento
      const resRol = await fetch(`http://nc.lynxnodes.es:25633/rol_admin_vs?userId=${user.id}`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      });
      if (resRol.ok) {
        const data = await resRol.json();
        authRol = data;
      }
    } catch (e) {
      console.error('Error comprobando rol_admin_vs:', e);
    }

    try {
      const res112 = await fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      });
      if (res112.ok) {
        const text = await res112.text();
        if (text) auth112 = JSON.parse(text);
      }
    } catch (e) {
      console.error('Error comprobando 112:', e);
    }
  }

  const isAuthorized = authRol.autorizado || auth112.autorizado;

  // Si no está autorizado como agente (o no hay usuario), mostramos la vista de emergencia para ciudadanos
  if (!isAuthorized) {
    // Si no hay usuario, creamos un perfil de invitado temporal
    const guestUser = user || {
      id: `anon_${Math.random().toString(36).substr(2, 9)}`,
      username: 'Ciudadano Anónimo',
      avatar: null,
      global_name: 'Ciudadano Anónimo'
    };

    return <CitizenEmergencyView discordUser={guestUser as any} />;
  }

  // Si es un agente autenticado y autorizado
  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage discordUser={user!} is112={auth112.autorizado} />
    </div>
  );
}
