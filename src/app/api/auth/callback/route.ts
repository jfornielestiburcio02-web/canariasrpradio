import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, getRedirectUri, getPublicUrl, SESSION_COOKIE, type DiscordUser } from '@/app/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(getPublicUrl('/?error=no_code', request));
  }

  const redirectUri = getRedirectUri(request);

  try {
    console.log(`[AUTH_CALLBACK] Intercambiando código con URI: ${redirectUri}`);
    
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
      console.error('[AUTH_CALLBACK] Discord Error:', tokens.error);
      return NextResponse.redirect(getPublicUrl(`/?error=auth_failed`, request));
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

    const targetUrl = getPublicUrl(`/inicio_desde_menu?id=${user.id}`, request);
    const response = NextResponse.redirect(targetUrl);

    // ESTABLECIMIENTO DE COOKIE CON PARÁMETROS CRÍTICOS PARA RENDER
    response.cookies.set(SESSION_COOKIE, JSON.stringify(user), {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // Vital para evitar pérdidas de sesión tras redirección de OAuth
      maxAge: 60 * 60 * 24 * 7,
      path: '/',        // Debe ser global
    });

    return response;
  } catch (error) {
    console.error('[AUTH_CALLBACK] Error crítico:', error);
    return NextResponse.redirect(getPublicUrl('/?error=server_error', request));
  }
}
