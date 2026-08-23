import { getSessionUser } from '@/app/lib/auth-utils';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';
import { headers } from 'next/headers';

export default async function RadioPage() {
  const user = await getSessionUser();
  
  let authRolVs = { autorizado: false };
  let authRolGral = { autorizado: false };
  let auth112 = { autorizado: false };

  if (user) {
    try {
      // Peticiones directas desde el servidor (evita Mixed Content)
      const baseUrl = 'http://nc.lynxnodes.es:25633';
      const fetchOptions = { cache: 'no-store' as const, signal: AbortSignal.timeout(4000) };

      const [resRolVs, resRolGral, res112] = await Promise.allSettled([
        fetch(`${baseUrl}/rol_admin_vs?userId=${user.id}`, fetchOptions),
        fetch(`${baseUrl}/comprobar_rol?ID=${user.id}`, fetchOptions),
        fetch(`${baseUrl}/comprobar_112?ID=${user.id}`, fetchOptions)
      ]);

      if (resRolVs.status === 'fulfilled' && resRolVs.value.ok) authRolVs = await resRolVs.value.json();
      if (resRolGral.status === 'fulfilled' && resRolGral.value.ok) authRolGral = await resRolGral.value.json();
      
      if (res112.status === 'fulfilled' && res112.value.ok) {
        const text = await res112.value.text();
        auth112 = { autorizado: text.includes('true') };
      }
    } catch (e) {
      console.error('[RADIO_PAGE] Error validando roles:', e);
    }
  }

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
      <RadioClientPage 
        discordUser={user!} 
        is112={auth112.autorizado} 
        isAdminVs={authRolVs.autorizado}
      />
    </div>
  );
}
