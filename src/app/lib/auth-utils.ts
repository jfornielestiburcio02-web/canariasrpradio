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
  
  console.log(`[AUTH_UTILS] Estableciendo sesión: ${user.username}`);

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
  
  // Debug de todas las cookies presentes
  const allCookies = cookieStore.getAll().map(c => c.name);
  console.log(`[AUTH_UTILS] Cookies disponibles en esta petición: [${allCookies.join(', ')}]`);

  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie || !cookie.value) {
    console.log(`[AUTH_UTILS] Cookie ${SESSION_COOKIE} no encontrada.`);
    return null;
  }
  
  try {
    return JSON.parse(cookie.value);
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
 */
export function getHostInfo(requestOrHeaders: Request | any) {
  const getHeader = (name: string) => {
    if (requestOrHeaders instanceof Request) return requestOrHeaders.headers.get(name);
    if (typeof requestOrHeaders.get === 'function') return requestOrHeaders.get(name);
    return null;
  };

  const xHost = getHeader('x-forwarded-host');
  const xProto = getHeader('x-forwarded-proto') || 'https';
  
  // En Render, el host real está en x-forwarded-host
  let host = xHost || 'teneriferpradio.onrender.com';
  
  // Limpiar posibles puertos internos de Render (10000, 0.0.0.0, etc)
  if (host.includes('0.0.0.0') || host.includes('10000') || host.includes('localhost')) {
    host = 'teneriferpradio.onrender.com';
  }

  return { host, proto: xProto };
}

export function getRedirectUri(requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}/api/auth/callback`;
}

export function getPublicUrl(path: string, requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}${path}`;
}
