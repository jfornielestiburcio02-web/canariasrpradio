
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
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'User-Agent': 'TenerifeRP-Comms-System/1.1',
        'Accept': 'application/json',
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      if (res.status === 403) {
        return { 
          success: false, 
          error: 'Error 403: Acceso denegado. Verifica que la "Server API" esté activada en los ajustes de tu servidor privado de ERLC y que el token sea correcto.' 
        };
      }
      if (res.status === 401) return { success: false, error: 'Token de ERLC no autorizado o expirado.' };
      if (res.status === 429) return { success: false, error: 'Demasiadas peticiones (Rate Limit). Espera un momento.' };
      return { success: false, error: `Error de API ERLC: Código ${res.status}` };
    }

    const players = await res.json();
    return { success: true, players: Array.isArray(players) ? players : [] };
  } catch (error) {
    console.error('[ERLC_API_ERROR]', error);
    return { success: false, error: 'Fallo crítico de conexión con la infraestructura de Liberty County.' };
  }
}

export async function getErlcServerInfo() {
  try {
    const res = await fetch(`${API_BASE}`, {
      headers: {
        'Server-Key': ERLC_TOKEN,
        'User-Agent': 'TenerifeRP-Comms-System/1.1',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) return { success: false, error: 'No se pudo obtener información del servidor.' };
    
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error de conexión satelital con el servidor.' };
  }
}
