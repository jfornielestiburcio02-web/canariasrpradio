
import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import RadioClientPage from '@/components/radio/RadioClientPage';

export default async function RadioPage() {
  const user = await getSessionUser();

  // Verificación de sesión de servidor para máxima seguridad
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RadioClientPage discordUser={user} />
    </div>
  );
}
