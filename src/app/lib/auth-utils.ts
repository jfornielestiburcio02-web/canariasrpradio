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
 * Persiste la sesión del usuario.
 */
export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  console.log(`[AUTH_UTILS] Intentando establecer sesión para: ${user.username} (ID: ${user.id})`);

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/',
  });
  
  console.log('[AUTH_UTILS] Cookie enviada a la cola de headers.');
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie || !cookie.value) {
    console.log('[AUTH_UTILS] getSessionUser: No se encontró la cookie de sesión.');
    return null;
  }
  
  try {
    const user = JSON.parse(cookie.value);
    console.log(`[AUTH_UTILS] getSessionUser: Sesión recuperada para ${user.username}`);
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
 */
export function getHostInfo(requestOrHeaders: Request | any) {
  let host = '';
  let proto = 'https';

  const getHeader = (name: string) => {
    if (requestOrHeaders instanceof Request) return requestOrHeaders.headers.get(name);
    if (typeof requestOrHeaders.get === 'function') return requestOrHeaders.get(name);
    if (requestOrHeaders.headers && typeof requestOrHeaders.headers.get === 'function') return requestOrHeaders.headers.get(name);
    return null;
  };

  const xHost = getHeader('x-forwarded-host');
  const xProto = getHeader('x-forwarded-proto');
  const standardHost = getHeader('host');

  host = xHost || standardHost || '';
  proto = xProto || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');

  // Limpiar puertos internos de Render
  if (host.includes('0.0.0.0') || host.includes('10000')) {
    if (xHost) {
      host = xHost.split(':')[0];
    } else {
      host = 'teneriferpradio.onrender.com';
    }
  }

  if (host.includes('.onrender.com')) {
    host = host.split(':')[0];
  }

  return { host, proto };
}

export function getRedirectUri(requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  const uri = `${proto}://${host}/api/auth/callback`;
  console.log(`[AUTH_UTILS] Generada Redirect URI: ${uri}`);
  return uri;
}

export function getPublicUrl(path: string, requestOrHeaders: Request | any) {
  const { host, proto } = getHostInfo(requestOrHeaders);
  return `${proto}://${host}${path}`;
}
