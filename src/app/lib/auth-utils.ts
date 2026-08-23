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
 * Prioriza X-Forwarded-Host para detectar el dominio público en Workstations y Vercel.
 */
export function getRedirectUri(requestOrHeaders: Request | any) {
  let host = '';
  let proto = 'https';

  if (requestOrHeaders instanceof Request) {
    const xHost = requestOrHeaders.headers.get('x-forwarded-host');
    const xProto = requestOrHeaders.headers.get('x-forwarded-proto');
    host = xHost || requestOrHeaders.headers.get('host') || '';
    proto = xProto || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  } else if (typeof requestOrHeaders.get === 'function') {
    const xHost = requestOrHeaders.get('x-forwarded-host');
    const xProto = requestOrHeaders.get('x-forwarded-proto');
    host = xHost || requestOrHeaders.get('host') || '';
    proto = xProto || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  }

  // Limpiar el host si contiene puertos internos que Discord no acepta desde el exterior
  if (host.includes('.cloudworkstations.dev') && host.includes(':')) {
    host = host.split(':')[0];
  }

  const uri = `${proto}://${host}/inicio_desde_menu`;
  console.log('[AUTH_UTILS] Redirect URI detectada:', uri);
  return uri;
}
