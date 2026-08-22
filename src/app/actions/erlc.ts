'use server';

/**
 * @fileOverview Acción del servidor para interactuar con la API de ERLC (Liberty County).
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

    if (!res.ok) return { success: false, error: `Error de API ERLC: Código ${res.status}` };

    const players = await res.json();
    return { success: true, players: Array.isArray(players) ? players : [] };
  } catch (error) {
    return { success: false, error: 'Fallo de conexión con ERLC.' };
  }
}

export async function getErlcLogs() {
  try {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'User-Agent': 'TenerifeRP-Comms-System/1.1',
        'Accept': 'application/json',
      },
      next: { revalidate: 5 },
    });

    if (!res.ok) return { success: false, error: 'No se pudo obtener el log de ERLC.' };
    
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
        'User-Agent': 'TenerifeRP-Comms-System/1.1',
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
