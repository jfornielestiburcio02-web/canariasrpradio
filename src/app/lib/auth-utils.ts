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
  
  console.log(`[AUTH_UTILS] setSessionUser para: ${user.username}`);

  // Configuración recomendada para Render (HTTPS)
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // Obligatorio para persistencia tras redirecciones OAuth en Render
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies, headers } = await import('next/headers');
  const cookieStore = await cookies();
  const headersList = await headers();
  
  const host = headersList.get('host');
  const cookie = cookieStore.get(SESSION_COOKIE);
  const allCookies = cookieStore.getAll().map(c => c.name);
  
  if (!cookie || !cookie.value) {
    console.log(`[AUTH_UTILS] getSessionUser [HOST: ${host}]: Cookie NO encontrada. Disponibles: [${allCookies.join(', ')}]`);
    return null;
  }
  
  try {
    const user = JSON.parse(cookie.value);
    console.log(`[AUTH_UTILS] getSessionUser [HOST: ${host}]: Sesión recuperada para: ${user.username}`);
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
 * Detecta la información del host público de forma robusta ignorando IPs internas.
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
  
  // Limpieza de hosts internos de Render o Workstations
  if (host.includes('0.0.0.0') || host.includes('10000') || host.includes('localhost') || host.includes('127.0.0.1')) {
    if (hostHeader && (hostHeader.includes('cloudworkstations.dev') || hostHeader.includes('onrender.com'))) {
      host = hostHeader;
    } else {
      host = 'teneriferpradio.onrender.com';
    }
  }

  // Siempre HTTPS en producción o entornos de desarrollo remotos
  const proto = 'https';

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
