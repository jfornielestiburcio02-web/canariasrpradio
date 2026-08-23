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

/**
 * Persiste la sesión del usuario.
 * Ajustado para máxima compatibilidad con Render (HTTPS) y entornos de desarrollo.
 */
export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  // Determinamos si estamos en un entorno seguro (HTTPS)
  const isProd = process.env.NODE_ENV === 'production';

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true, // Siempre true para Discord OAuth y Render
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/',
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie || !cookie.value) {
    console.log('[AUTH_UTILS] Cookie de sesión no encontrada');
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
 * Genera el redirect_uri dinámicamente basado en los headers de la petición.
 * Optimizado para Render, Vercel y Cloud Workstations.
 */
export function getRedirectUri(requestOrHeaders: Request | any) {
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

  // Limpiar puertos internos si existen en la URL pública (común en Workstations)
  if (host.includes(':') && (host.includes('.cloudworkstations.dev') || host.includes('.onrender.com') || host.includes('.vercel.app'))) {
    host = host.split(':')[0];
  }

  // Caso especial para local en Workstations
  if (host.includes('127.0.0.1') || host.includes('localhost')) {
    proto = 'http';
  }

  const uri = `${proto}://${host}/inicio_desde_menu`;
  console.log('[AUTH_UTILS] Generando Redirect URI:', uri);
  return uri;
}
