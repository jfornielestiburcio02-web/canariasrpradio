
import { getSessionUser } from '@/app/lib/auth-utils';
import RadioClientPage from '@/components/radio/RadioClientPage';
import { CitizenEmergencyView } from '@/components/radio/CitizenEmergencyView';
import { headers } from 'next/headers';

export default async function RadioPage() {
  const user = await getSessionUser();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const apiBase = `${protocol}://${host}/api/proxy/roles`;

  let authRolVs = { autorizado: false };
  let authRolGral = { autorizado: false };
  let auth112 = { autorizado: false };

  if (user) {
    try {
      // Usamos el Proxy API interno para evitar bloqueos de Mixed Content en Vercel
      const [resRolVs, resRolGral, res112] = await Promise.all([
        fetch(`${apiBase}?type=admin_vs&id=${user.id}`, { cache: 'no-store' }),
        fetch(`${apiBase}?type=rol_gral&id=${user.id}`, { cache: 'no-store' }),
        fetch(`${apiBase}?type=112&id=${user.id}`, { cache: 'no-store' })
      ]);

      if (resRolVs.ok) authRolVs = await resRolVs.json();
      if (resRolGral.ok) authRolGral = await resRolGral.json();
      if (res112.ok) auth112 = await res112.json();
    } catch (e) {
      console.error('Error en validación de acceso institucional:', e);
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
