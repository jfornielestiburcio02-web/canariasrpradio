import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, getRedirectUri, getPublicUrl, SESSION_COOKIE, type DiscordUser } from '@/app/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('[AUTH_CALLBACK] No se recibió el código de Discord');
    return NextResponse.redirect(getPublicUrl('/?error=no_code', request));
  }

  const redirectUri = getRedirectUri(request);

  try {
    console.log(`[AUTH_CALLBACK] Iniciando intercambio de código...`);
    
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: DISCORD_CONFIG.clientId,
        client_secret: DISCORD_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('[AUTH_CALLBACK] Error de Discord:', tokens.error);
      return NextResponse.redirect(getPublicUrl(`/?error=auth_failed&msg=${encodeURIComponent(tokens.error)}`, request));
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userData = await userResponse.json();
    
    if (!userData.id) {
      return NextResponse.redirect(getPublicUrl('/?error=no_user_data', request));
    }

    const user: DiscordUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      global_name: userData.global_name,
    };

    console.log(`[AUTH_CALLBACK] Usuario validado: ${user.username}. Estableciendo sesión...`);

    // Redirección a la página de inicio tras validación exitosa
    const targetUrl = getPublicUrl(`/inicio_desde_menu?id=${user.id}`, request);
    console.log(`[AUTH_CALLBACK] Cookie establecida y redirigiendo a: ${targetUrl}`);
    
    const response = NextResponse.redirect(targetUrl);

    // Inyectamos la cookie directamente con los parámetros requeridos por Render
    response.cookies.set(SESSION_COOKIE, JSON.stringify(user), {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // Crucial para entornos de proxy/Render
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[AUTH_CALLBACK] Error crítico en el servidor:', error);
    return NextResponse.redirect(getPublicUrl('/?error=server_error', request));
  }
}
