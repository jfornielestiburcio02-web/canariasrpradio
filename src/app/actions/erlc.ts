
'use server';

/**
 * @fileOverview Acción del servidor para la API v2 de ERLC.
 * Endpoints actualizados según https://apidocs.erlc.gg/
 */

const ERLC_TOKEN = 'xyeudvMYwXSFSovUiInp-knDrUYMtahndQKHRHWQVWWVWtQtAEotHpqcLexDq';
const API_BASE = 'https://api.erlc.gg/v2';

export async function getErlcPlayers() {
  try {
    const res = await fetch(`${API_BASE}/server/players`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: `Error ${res.status}: ${errorData.info || errorData.message || 'Error de Autenticación'} (Código: ${errorData.code || '9999'})` 
      };
    }

    const players = await res.json();
    return { success: true, players: Array.isArray(players) ? players : [] };
  } catch (error) {
    return { success: false, error: 'Fallo de conexión con el satélite de Liberty County.' };
  }
}

export async function getErlcLogs() {
  try {
    const res = await fetch(`${API_BASE}/server/logs`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: `Error Log ${res.status}: ${errorData.info || 'Verifique su Server-Key en el panel de ERLC'}` 
      };
    }
    
    const logs = await res.json();
    return { success: true, logs: Array.isArray(logs) ? logs : [] };
  } catch (error) {
    return { success: false, error: 'Error de red en la descarga de logs.' };
  }
}

export async function getErlcServerInfo() {
  try {
    const res = await fetch(`${API_BASE}/server`, {
      method: 'GET',
      headers: {
        'Server-Key': ERLC_TOKEN,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.info || 'No se pudo validar el Server-Key' };
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error de conexión satelital.' };
  }
}
