
import { cookies } from 'next/headers';

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

const SESSION_COOKIE_NAME = 'cadiz_rp_session';

export async function getSessionUser(): Promise<DiscordUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session) return null;
  try {
    return JSON.parse(session.value) as DiscordUser;
  } catch {
    return null;
  }
}

export async function setSessionUser(user: DiscordUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const DISCORD_CONFIG = {
  clientId: '1493655919010255110',
  clientSecret: '6Dh1PWv0mw0T5Vqv3ynOnNR43soQa65l',
};

/**
 * Calcula dinámicamente la URI de redirección basada en la solicitud actual.
 * Esto es crucial para entornos de desarrollo como Cloud Workstations.
 */
export function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const protocol = request.headers.get('x-forwarded-proto') || (url.protocol === 'https:' ? 'https' : 'http');
  const host = request.headers.get('host') || url.host;
  return `${protocol}://${host}/api/auth/callback`;
}
