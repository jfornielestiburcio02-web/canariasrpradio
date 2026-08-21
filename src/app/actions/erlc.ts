
'use server';

/**
 * @fileOverview Acción del servidor para interactuar con la API de ERLC (Liberty County).
 * Se utiliza el token proporcionado para obtener información de los servidores y jugadores.
 */

const ERLC_TOKEN = 'fYoIctfUSmpezjVNcajg-knDrUYMtahndQKHRHWQVWWVWtQtAEotHpqcLexDq';
const API_BASE = 'https://api.policeroleplay.community/v1/server';

export async function getErlcPlayers() {
  try {
    const res = await fetch(`${API_BASE}/players`, {
      headers: {
        'Server-Key': ERLC_TOKEN,
      },
      next: { revalidate: 10 }, // Cache de 10 segundos
    });

    if (!res.ok) {
      if (res.status === 401) return { error: 'Token de ERLC inválido o expirado.' };
      return { error: 'El servidor de ERLC no responde.' };
    }

    const players = await res.json();
    return { success: true, players };
  } catch (error) {
    console.error('[ERLC_API_ERROR]', error);
    return { error: 'Error de conexión con la infraestructura de Liberty County.' };
  }
}

export async function getErlcServerInfo() {
  try {
    const res = await fetch(`${API_BASE}`, {
      headers: {
        'Server-Key': ERLC_TOKEN,
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) return { error: 'No se pudo obtener información del servidor.' };
    
    return await res.json();
  } catch (error) {
    return { error: 'Error de conexión.' };
  }
}
