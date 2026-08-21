
import { getSessionUser } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import RadioClientPage from '@/components/radio/RadioClientPage';

export default async function RadioPage() {
  const user = await getSessionUser();

  // Verificación de sesión de Discord
  if (!user) {
    redirect('/');
  }

  return <RadioClientPage discordUser={user} />;
}
