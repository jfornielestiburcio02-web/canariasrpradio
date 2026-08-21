
import { NextResponse } from 'next/server';

/**
 * Endpoint para obtener la configuración de servidores ICE.
 * Utiliza el servidor TURN proporcionado: free.expressturn.com
 */
export async function GET() {
  try {
    // Configuración del servidor TURN proporcionado por el usuario
    const turnServer = {
      urls: [
        "turn:free.expressturn.com:3478?transport=udp",
        "turn:free.expressturn.com:3478?transport=tcp",
        "turns:free.expressturn.com:3478?transport=tcp"
      ],
      username: "000000002102697359",
      credential: "F+K5UCLkondH6gZy7FHo7Ehdinc="
    };

    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      turnServer
    ];
    
    console.log('[ICE_SERVER_API] Entregando configuración TURN a cliente');
    return NextResponse.json(iceServers);
  } catch (error) {
    console.error('[ICE_SERVER_API] Error building ICE config:', error);
    return NextResponse.json([
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ]);
  }
}
