import { getSessionUser } from '@/app/lib/auth-utils';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';
import { redirect } from 'next/navigation';

export default async function RadioPage() {
  const user = await getSessionUser();
  
  if (!user) {
    // Si no hay usuario de Discord, permitimos vista de ciudadano anónimo o redirigimos a login
    // En este caso, redirigimos para asegurar que hay un ID de Discord para el WebSocket
    redirect('/');
  }

  let authRolVs = { autorizado: false };
  let authRolGral = { autorizado: false };
  let auth112 = { autorizado: false };

  try {
    const baseUrl = 'http://nc.lynxnodes.es:25633';
    // Timeout más largo para servidores externos lentos desde Vercel
    const fetchOptions = { 
      cache: 'no-store' as const, 
      signal: AbortSignal.timeout(6000),
      headers: { 'Accept': 'application/json' }
    };

    const [resRolVs, resRolGral, res112] = await Promise.allSettled([
      fetch(`${baseUrl}/rol_admin_vs?userId=${user.id}`, fetchOptions),
      fetch(`${baseUrl}/comprobar_rol?ID=${user.id}`, fetchOptions),
      fetch(`${baseUrl}/comprobar_112?ID=${user.id}`, fetchOptions)
    ]);

    if (resRolVs.status === 'fulfilled' && resRolVs.value.ok) {
      authRolVs = await resRolVs.value.json().catch(() => ({ autorizado: false }));
    }
    
    if (resRolGral.status === 'fulfilled' && resRolGral.value.ok) {
      authRolGral = await resRolGral.value.json().catch(() => ({ autorizado: false }));
    }
    
    if (res112.status === 'fulfilled' && res112.value.ok) {
      const text = await res112.value.text().catch(() => '');
      auth112 = { autorizado: text.toLowerCase().includes('true') };
    }
  } catch (e) {
    console.error('[RADIO_PAGE] Error crítico validando roles:', e);
  }

  const isAuthorized = authRolVs.autorizado || authRolGral.autorizado || auth112.autorizado;

  if (!isAuthorized) {
    return <CitizenEmergencyView discordUser={user} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage 
        discordUser={user} 
        is112={auth112.autorizado} 
        isAdminVs={authRolVs.autorizado}
      />
    </div>
  );
}
