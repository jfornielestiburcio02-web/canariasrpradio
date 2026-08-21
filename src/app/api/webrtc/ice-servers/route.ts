
import { NextResponse } from 'next/server';

/**
 * Endpoint para obtener la configuración de servidores ICE de forma segura.
 * Oculta la API Key de Metered del cliente final.
 */
export async function GET() {
  const apiKey = process.env.TURN_API_KEY;
  
  if (!apiKey) {
    console.warn('[ICE_SERVER_API] No TURN_API_KEY found in environment. Using default STUN.');
    return NextResponse.json([
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ]);
  }

  try {
    // Consultamos al proveedor Metered para obtener la lista actualizada de servidores TURN/STUN
    const response = await fetch(
      `https://canariasrpradio.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`Metered API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Combinamos con servidores STUN públicos de Google para mayor redundancia
    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      ...data
    ];
    
    return NextResponse.json(iceServers);
  } catch (error) {
    console.error('[ICE_SERVER_API] Error fetching TURN credentials:', error);
    return NextResponse.json([
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ]);
  }
}
