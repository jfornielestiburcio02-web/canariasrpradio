import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, setSessionUser, getRedirectUri, type DiscordUser } from '@/app/lib/auth-utils';

/**
 * Route Handler centralizado para el intercambio de tokens de Discord.
 * Este método es el más fiable para establecer cookies en producción.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('[AUTH_CALLBACK] No se recibió código de Discord');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const redirectUri = getRedirectUri(request);

  try {
    // 1. Intercambiar código por tokens
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: DISCORD_CONFIG.clientId,
        client_secret: DISCORD_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('[AUTH_CALLBACK] Error de Token:', tokens.error_description || tokens.error);
      return NextResponse.redirect(new URL(`/?error=auth_failed&msg=${encodeURIComponent(tokens.error)}`, request.url));
    }

    // 2. Obtener perfil de usuario
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userData = await userResponse.json();
    
    if (!userData.id) {
      console.error('[AUTH_CALLBACK] No se pudo obtener el perfil de usuario');
      return NextResponse.redirect(new URL('/?error=no_user_data', request.url));
    }

    // 3. Establecer la sesión y cookie
    const user: DiscordUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      global_name: userData.global_name,
    };

    await setSessionUser(user);

    // 4. Redirigir al panel principal
    return NextResponse.redirect(new URL('/inicio_desde_menu', request.url));
  } catch (error) {
    console.error('[AUTH_CALLBACK] Error crítico en el servidor:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
