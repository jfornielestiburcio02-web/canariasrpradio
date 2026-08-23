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
 * Ajustado para máxima compatibilidad con Render (HTTPS) y dominios personalizados.
 */
export async function setSessionUser(user: DiscordUser) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  console.log('[AUTH_UTILS] Estableciendo sesión para:', user.username);

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: true, // Siempre true para producción en Render/Vercel
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/', // Crucial para que sea accesible en /rad y /jef
  });
}

export async function getSessionUser(): Promise<DiscordUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie || !cookie.value) {
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
 * Genera el redirect_uri dinámicamente.
 * El endpoint de callback debe ser el mismo que el registrado en Discord.
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

  // En Render/Vercel, x-forwarded-host contiene el dominio público
  host = xHost || standardHost || '';
  proto = xProto || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');

  // Limpiar puertos internos de Render si aparecen
  if (host.includes('.onrender.com') || host.includes('.vercel.app')) {
    host = host.split(':')[0];
  }

  const uri = `${proto}://${host}/api/auth/callback`;
  console.log('[AUTH_UTILS] Redirect URI Calculado:', uri);
  return uri;
}
