
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
        'User-Agent': 'TenerifeRP-Comms-System/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 15 }, // Cache de 15 segundos para no saturar la API
    });

    if (!res.ok) {
      if (res.status === 401) return { success: false, error: 'Token de ERLC inválido o expirado.' };
      if (res.status === 429) return { success: false, error: 'Demasiadas peticiones. Espera un momento.' };
      if (res.status === 404) return { success: false, error: 'Servidor de Liberty County no encontrado o apagado.' };
      return { success: false, error: `Error de API ERLC: Código ${res.status}` };
    }

    const players = await res.json();
    return { success: true, players: Array.isArray(players) ? players : [] };
  } catch (error) {
    console.error('[ERLC_API_ERROR]', error);
    return { success: false, error: 'Fallo de conexión con la infraestructura de Liberty County.' };
  }
}

export async function getErlcServerInfo() {
  try {
    const res = await fetch(`${API_BASE}`, {
      headers: {
        'Server-Key': ERLC_TOKEN,
        'User-Agent': 'TenerifeRP-Comms-System/1.0',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) return { success: false, error: 'No se pudo obtener información del servidor.' };
    
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error de conexión satelital.' };
  }
}
