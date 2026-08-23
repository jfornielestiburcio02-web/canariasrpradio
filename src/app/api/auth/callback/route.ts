
import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, setSessionUser, getRedirectUri } from '@/app/lib/auth-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('No code received from Discord');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  // Obtener el redirectUri dinámicamente para que coincida con el paso 1
  const redirectUri = getRedirectUri(request);
  console.log('[AUTH_CALLBACK] Using dynamic redirect URI:', redirectUri);

  try {
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

    const tokenText = await tokenResponse.text();
    if (!tokenText) throw new Error('Empty token response from Discord');
    const tokens = JSON.parse(tokenText);
    
    if (tokens.error) {
      console.error('Discord Token Error:', tokens.error, tokens.error_description);
      return NextResponse.redirect(new URL(`/?error=auth_failed&msg=${encodeURIComponent(tokens.error)}`, request.url));
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userText = await userResponse.text();
    if (!userText) throw new Error('Empty user response from Discord');
    const userData = JSON.parse(userText);
    
    if (!userData.id) {
      console.error('No user data received from Discord');
      return NextResponse.redirect(new URL('/?error=no_user_data', request.url));
    }

    await setSessionUser({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
    });

    return NextResponse.redirect(new URL('/inicio_desde_menu', request.url));
  } catch (error) {
    console.error('Auth Callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
