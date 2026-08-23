
'use server';

import { headers } from 'next/headers';
import { DISCORD_CONFIG, setSessionUser, type DiscordUser, getRedirectUri } from '@/app/lib/auth-utils';

export async function handleDiscordAuth(code: string) {
  try {
    const headersList = await headers();
    const redirectUri = getRedirectUri(headersList);
    
    console.log('[AUTH_ACTION] Intercambio de token en:', redirectUri);

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
      console.error('[AUTH_ACTION] Error de Discord:', tokens.error_description || tokens.error);
      throw new Error(tokens.error_description || `Error de Discord: ${tokens.error}`);
    }

    if (!tokens.access_token) {
      throw new Error('No se recibió el token de acceso');
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userData = await userResponse.json();
    
    if (!userData.id) {
      throw new Error('No se pudo obtener el perfil de Discord');
    }

    const discordUser: DiscordUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      global_name: userData.global_name,
    };

    await setSessionUser(discordUser);

    return { success: true, user: discordUser };
  } catch (error: any) {
    console.error('[AUTH_ACTION] Error crítico:', error.message);
    return { success: false, error: error.message || 'Error en el servidor de autenticación' };
  }
}
