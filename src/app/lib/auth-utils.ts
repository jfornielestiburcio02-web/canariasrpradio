
/**
 * Configuración de Discord para Tenerife RP
 */
export const DISCORD_CONFIG = {
  clientId: '1534483909830512730',
  clientSecret: 'XxRvqzyXgPe_qHA7WEfJrP7Xxd5zSKCx',
};

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  global_name?: string;
}

const SESSION_COOKIE = 'tenerife_rp_session';

export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/',
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function logout() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Genera el redirect_uri dinámicamente basado en los headers de la petición.
 */
export function getRedirectUri(requestOrHeaders: Request | any) {
  let host = '';
  
  if (requestOrHeaders instanceof Request) {
    host = requestOrHeaders.headers.get('host') || '';
  } else if (typeof requestOrHeaders.get === 'function') {
    host = requestOrHeaders.get('host') || '';
  }

  // Detectar protocolo
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  
  return `${protocol}://${host}/inicio_desde_menu`;
}
