
import { getSessionUser } from '@/app/lib/auth-utils';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';

export default async function RadioPage() {
  const user = await getSessionUser();

  let authRolVs = { autorizado: false, mensaje: "" };
  let authRolGral = { autorizado: false, mensaje: "" };
  let auth112 = { autorizado: false, mensaje: "" };

  if (user) {
    try {
      const fetchOptions = { cache: 'no-store' as const, signal: AbortSignal.timeout(4000) };
      
      const [resRolVs, resRolGral, res112] = await Promise.allSettled([
        fetch(`http://nc.lynxnodes.es:25633/rol_admin_vs?userId=${user.id}`, fetchOptions),
        fetch(`http://nc.lynxnodes.es:25633/comprobar_rol?ID=${user.id}`, fetchOptions),
        fetch(`http://nc.lynxnodes.es:25633/comprobar_112?ID=${user.id}`, fetchOptions)
      ]);

      if (resRolVs.status === 'fulfilled' && resRolVs.value.ok) authRolVs = await resRolVs.value.json();
      if (resRolGral.status === 'fulfilled' && resRolGral.value.ok) authRolGral = await resRolGral.value.json();
      if (res112.status === 'fulfilled' && res112.value.ok) {
        const text = await res112.value.text();
        if (text) auth112 = JSON.parse(text);
      }
    } catch (e) {
      console.error('Error en la triple validación de acceso:', e);
    }
  }

  // Si tiene CUALQUIERA de los 3 roles, es personal autorizado
  const isAuthorized = authRolVs.autorizado || authRolGral.autorizado || auth112.autorizado;

  if (!isAuthorized) {
    const guestUser = user || {
      id: `anon_${Math.random().toString(36).substr(2, 9)}`,
      username: 'Ciudadano Anónimo',
      avatar: null,
      global_name: 'Ciudadano Anónimo'
    };
    return <CitizenEmergencyView discordUser={guestUser as any} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage discordUser={user!} is112={auth112.autorizado} />
    </div>
  );
}
