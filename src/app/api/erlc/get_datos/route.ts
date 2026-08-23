
import { NextResponse } from 'next/server';
import { dbRadio as firestore } from '@/lib/firebase-radio';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * @fileOverview Endpoint para Webhooks de ERLC.
 * Procesa eventos de pánico y telemetría (X, Y, Z) para el mapa táctico.
 * Incluye validación de Handshake para el probe de ER:LC.
 */

export async function POST(req: Request) {
  // Validación de Handshake de ER:LC
  // ER:LC envía un "probe" firmado pero sin cuerpo para validar el endpoint.
  // Debemos responder con un código 4xx (e.g. 400) para que la validación sea exitosa en Roblox.
  const signature = req.headers.get('erl-signature') || req.headers.get('erlc-webhook-signature');
  const contentLength = req.headers.get('content-length');

  if (signature && (!contentLength || contentLength === '0')) {
    return new Response('Bad Request (ERLC Probe)', { status: 400 });
  }

  try {
    const body = await req.json();

    const tipo = (body.Event || body.tipo || 'INFO').toUpperCase();
    const sujeto = body.Player || body.sujeto || 'Sistema';
    const detalles = body.Details || body.detalles || 'Sin detalles';
    
    // Coordenadas si vienen en el body (formato ERLC v2 logs)
    const x = body.X !== undefined ? Number(body.X) : null;
    const y = body.Y !== undefined ? Number(body.Y) : null;
    const z = body.Z !== undefined ? Number(body.Z) : null;

    const ubicacion = body.Location || body.ubicacion || (tipo.includes('PANIC') ? detalles : 'Ubicación Desconocida');

    // Registrar el evento en el log global
    const eventRef = await addDoc(collection(firestore, 'erlcEvents'), {
      tipo,
      sujeto,
      ubicacion,
      detalles: tipo.includes('PANIC') ? '¡BOTÓN DE PÁNICO ACTIVADO!' : detalles,
      x, y, z,
      timestamp: serverTimestamp()
    });

    // Si tiene coordenadas, actualizamos la tabla de posiciones en tiempo real
    if (x !== null && z !== null && sujeto !== 'Sistema') {
      await setDoc(doc(firestore, 'playerPositions', sujeto), {
        playerName: sujeto,
        x, y, z,
        lastUpdate: serverTimestamp()
      }, { merge: true });
    }

    return NextResponse.json({ success: true, id: eventRef.id });
  } catch (error: any) {
    // Si falla el parseo de JSON (como en el probe si no tiene cuerpo), respondemos 400
    // Esto es lo que espera ER:LC para validar el webhook
    console.warn('[ERLC_WEBHOOK_HANDSHAKE] Solicitud no procesable o Probe detectado.');
    return new Response('Bad Request', { status: 400 });
  }
}

export async function GET() {
  try {
    const q = query(collection(firestore, 'erlcEvents'), orderBy('timestamp', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // También devolvemos las posiciones actuales de los jugadores
    const posSnapshot = await getDocs(collection(firestore, 'playerPositions'));
    const positions = posSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      events,
      positions 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
