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
        'User-Agent': 'TenerifeRP-Comms/1.2 (ERLC-Server-ID: 2534724415)',
        'Accept': 'application/json',
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `API Error ${res.status}: ${errorText.substring(0, 50)}` };
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
        'User-Agent': 'TenerifeRP-Comms/1.2 (ERLC-Server-ID: 2534724415)',
        'Accept': 'application/json',
      },
      next: { revalidate: 5 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Log API Error ${res.status}: ${errorText.substring(0, 50)}` };
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
        'User-Agent': 'TenerifeRP-Comms/1.2',
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
