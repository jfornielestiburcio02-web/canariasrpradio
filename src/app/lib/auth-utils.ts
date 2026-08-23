
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
  const getHeader = (name: string) => {
    if (requestOrHeaders instanceof Request) {
      return requestOrHeaders.headers.get(name);
    } else if (typeof requestOrHeaders.get === 'function') {
      return requestOrHeaders.get(name);
    }
    return null;
  };

  const xHost = getHeader('x-forwarded-host');
  const host = xHost || getHeader('host') || '';
  const proto = getHeader('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  
  console.log('[AUTH_UTILS] Detectando URI:', { proto, host, isForwarded: !!xHost });

  return `${proto}://${host}/inicio_desde_menu`;
}
