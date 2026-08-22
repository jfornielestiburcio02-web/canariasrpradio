
'use server';

/**
 * @fileOverview Acción del servidor para interactuar con la API de ERLC (Liberty County).
 * Se ha actualizado con el Server ID proporcionado por el usuario.
 */

const ERLC_TOKEN = 'fYoIctfUSmpezjVNcajg-knDrUYMtahndQKHRHWQVWWVWtQtAEotHpqcLexDq';
const SERVER_ID = '2534724415';
const API_BASE = 'https://api.policeroleplay.community/v1/server';

export async function getErlcPlayers() {
  try {
    const res = await fetch(`${API_BASE}/players`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Error ${res.status}: ${errorText.substring(0, 60)}` };
    }

    const players = await res.json();
    return { success: true, players: Array.isArray(players) ? players : [] };
  } catch (error) {
    return { success: false, error: 'Fallo de conexión satelital.' };
  }
}

export async function getErlcLogs() {
  try {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Error Log ${res.status}: ${errorText.substring(0, 60)}` };
    }
    
    const logs = await res.json();
    return { success: true, logs: Array.isArray(logs) ? logs : [] };
  } catch (error) {
    return { success: false, error: 'Error de conexión con logs.' };
  }
}

export async function getErlcServerInfo() {
  try {
    const res = await fetch(`${API_BASE}`, {
      headers: {
        'Server-Key': ERLC_TOKEN,
      },
      cache: 'no-store',
    });

    if (!res.ok) return { success: false, error: 'No se pudo obtener información del servidor.' };
    
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error de conexión satelital.' };
  }
}
