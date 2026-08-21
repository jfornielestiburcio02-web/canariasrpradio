
'use server';

import { DISCORD_CONFIG, setSessionUser, type DiscordUser } from '@/app/lib/auth-utils';

export async function handleDiscordAuth(code: string) {
  try {
    // 1. Intercambiar código por token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: DISCORD_CONFIG.clientId,
        client_secret: DISCORD_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_CONFIG.redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || 'Error al obtener el token');
    }

    // 2. Obtener datos del usuario
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userData: DiscordUser = await userResponse.json();

    if (!userData.id) {
      throw new Error('No se pudo obtener el perfil del usuario');
    }

    // 3. Guardar sesión
    await setSessionUser(userData);

    return { success: true, user: userData };
  } catch (error: any) {
    console.error('Auth Error:', error);
    return { success: false, error: error.message };
  }
}
