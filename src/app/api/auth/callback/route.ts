
import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, setSessionUser, getRedirectUri } from '@/app/lib/auth-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const redirectUri = getRedirectUri(request);

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

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Discord Token Error:', tokens.error);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userData = await userResponse.json();
    
    await setSessionUser({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      discriminator: userData.discriminator,
    });

    return NextResponse.redirect(new URL('/tablonera', request.url));
  } catch (error) {
    console.error('Auth Callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
