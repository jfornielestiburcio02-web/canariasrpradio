
import { NextResponse } from 'next/server';
import { DISCORD_CONFIG } from '@/app/lib/auth-utils';

export async function GET() {
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirectUri)}&response_type=code&scope=identify`;
  return NextResponse.redirect(discordUrl);
}
