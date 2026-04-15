
import { NextResponse } from 'next/server';
import { DISCORD_CONFIG, getRedirectUri } from '@/app/lib/auth-utils';

export async function GET(request: Request) {
  const redirectUri = getRedirectUri(request);
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  return NextResponse.redirect(discordUrl);
}
