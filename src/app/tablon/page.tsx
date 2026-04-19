
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/app/lib/auth-utils';
import { TablonClient } from '@/components/tablon/TablonClient';

export default async function TablonPage() {
  const user = await getSessionUser();

  // Si no hay sesión de Discord, redirigimos al login
  if (!user) {
    redirect('/api/auth/login');
  }

  return <TablonClient initialUser={user} />;
}
