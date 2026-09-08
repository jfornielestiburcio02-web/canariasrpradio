import { redirect } from 'next/navigation';
import { getSessionUser } from '@/app/lib/auth-utils';
import { TablonClient } from '@/components/tablon/TablonClient';

// Forzamos dinamismo absoluto para asegurar la lectura de la cookie global
export const dynamic = 'force-dynamic';

export default async function TablonPage() {
  const user = await getSessionUser();

  // Si no hay sesión de Discord, redirigimos al login
  if (!user) {
    redirect('/');
  }

  return <TablonClient initialUser={user} />;
}
