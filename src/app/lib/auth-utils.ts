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

export const SESSION_COOKIE = 'tenerife_rp_session';

/**
 * Persiste la sesión del usuario con configuración de máxima compatibilidad.
 */
export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  console.log(`[AUTH_UTILS] Estableciendo sesión manual para: ${user.username}`);

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie || !cookie.value) {
    const allCookies = cookieStore.getAll().map(c => c.name);
    console.log(`[AUTH_UTILS] getSessionUser: Cookie NO encontrada. Disponibles: [${allCookies.join(', ')}]`);
    return null;
  }
  
  try {
    const user = JSON.parse(cookie.value);
    console.log(`[AUTH_UTILS] Sesión recuperada para: ${user.username}`);
    return user;
  } catch (e) {
    console.error('[AUTH_UTILS] Error parseando sesión:', e);
    return null;
  }
}

export async function logout() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Detecta la información del host público de forma robusta.
 * Maneja Cloud Workstations, Render y entornos locales.
 */
export function getHostInfo(requestOrHeaders: Request | any) {
  const getHeader = (name: string) => {
    if (requestOrHeaders instanceof Request) return requestOrHeaders.headers.get(name);
    if (typeof requestOrHeaders.get === 'function') return requestOrHeaders.get(name);
    return null;
  };

  const xHost = getHeader('x-forwarded-host');
  const xProto = getHeader('x-forwarded-proto');
  const hostHeader = getHeader('host');
  
  let host = xHost || hostHeader || 'teneriferpradio.onrender.com';
  
  // Limpieza de hosts internos
  if (host.includes('0.0.0.0') || host.includes('10000') || host.includes('localhost:3000')) {
    // Si estamos en workstations, intentamos mantener el cluster si viene en headers
    if (hostHeader && hostHeader.includes('cloudworkstations.dev')) {
      host = hostHeader;
    } else {
      host = 'teneriferpradio.onrender.com';
    }
  }

  // En entornos de producción (Render) o Workstations (HTTPS Proxy), forzamos proto seguro
  const proto = xProto || (host.includes('localhost') ? 'http' : 'https');

  return { host, proto };
}

export function getRedirectUri(requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  const uri = `${proto}://${host}/api/auth/callback`;
  return uri;
}

export function getPublicUrl(path: string, requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}${path}`;
}
