import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, getRedirectUri } from '@/app/lib/auth-utils';

export async function GET(request: Request) {
  const redirectUri = getRedirectUri(request);
  const discordUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+guilds+guilds.members.read`;
  
  console.log('[AUTH_LOGIN] Redirigiendo a Discord con URI:', redirectUri);
  return NextResponse.redirect(discordUrl);
}
