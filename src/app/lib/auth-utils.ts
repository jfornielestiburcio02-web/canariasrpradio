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
 * Persiste la sesión del usuario con configuración compatible con Render (HTTPS).
 */
export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  console.log(`[AUTH_UTILS] Intentando establecer sesión para: ${user.username}`);

  // Configuración de máxima compatibilidad para Render + Discord
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true,      // Obligatorio para HTTPS
    sameSite: 'none',  // Obligatorio para evitar pérdidas tras redirección externa
    maxAge: 60 * 60 * 24 * 7,
    path: '/',         // Crucial para que se vea en /rad y /jef
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  const cookie = cookieStore.get(SESSION_COOKIE);
  const allCookies = cookieStore.getAll().map(c => c.name);
  
  if (!cookie || !cookie.value) {
    console.log(`[AUTH_UTILS] getSessionUser: Cookie NO encontrada. Disponibles: [${allCookies.join(', ')}]`);
    return null;
  }
  
  try {
    const user = JSON.parse(cookie.value);
    console.log(`[AUTH_UTILS] getSessionUser: Sesión recuperada para: ${user.username}`);
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
 * Detecta la información del host público ignorando IPs internas.
 */
export function getHostInfo(requestOrHeaders: Request | any) {
  const getHeader = (name: string) => {
    if (requestOrHeaders instanceof Request) return requestOrHeaders.headers.get(name);
    if (typeof requestOrHeaders.get === 'function') return requestOrHeaders.get(name);
    return null;
  };

  const xHost = getHeader('x-forwarded-host');
  const hostHeader = getHeader('host');
  
  let host = xHost || hostHeader || 'teneriferpradio.onrender.com';
  
  if (host.includes('0.0.0.0') || host.includes('10000') || host.includes('localhost')) {
    host = 'teneriferpradio.onrender.com';
  }

  return { host, proto: 'https' };
}

export function getRedirectUri(requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}/api/auth/callback`;
}

export function getPublicUrl(path: string, requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}${path}`;
}
