
import { NextResponse } from 'next/server';
import { dbRadio as firestore } from '@/lib/firebase-radio';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * @fileOverview Endpoint para Webhooks de ER:LC v2.
 * Implementa el Handshake oficial respondiendo 400 JSON a los Probes firmados.
 * Utiliza los headers oficiales: X-ERLC-Signature y X-ERLC-ProbeValue.
 */

export async function POST(req: Request) {
  // 1. Detección de Headers oficiales (Case-insensitive)
  const signature = req.headers.get('X-ERLC-Signature') || req.headers.get('x-erlc-signature');
  const probeValue = req.headers.get('X-ERLC-ProbeValue') || req.headers.get('x-erlc-probevalue');
  const contentLength = req.headers.get('content-length');

  // 2. Validación de Handshake (ER:LC Probe)
  // Roblox requiere un código 4xx (400) con cuerpo JSON válido para aceptar la URL.
  if (probeValue || (signature && (!contentLength || contentLength === '0'))) {
    console.log('[ERLC_HANDSHAKE] Detectada validación inicial (Probe) de Roblox.');
    return NextResponse.json(
      { status: 'error', message: 'ERLC Validation Probe Handled' }, 
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const tipo = (body.Event || body.tipo || 'INFO').toUpperCase();
    const sujeto = body.Player || body.sujeto || 'Sistema';
    const detalles = body.Details || body.detalles || 'Sin detalles';
    
    // Telemetría Satelital (X, Y, Z)
    const x = body.X !== undefined ? Number(body.X) : null;
    const y = body.Y !== undefined ? Number(body.Y) : null;
    const z = body.Z !== undefined ? Number(body.Z) : null;

    const ubicacion = body.Location || body.ubicacion || (tipo.includes('PANIC') ? detalles : 'Ubicación Desconocida');

    // Registrar en el log de eventos institucional
    const eventRef = await addDoc(collection(firestore, 'erlcEvents'), {
      tipo,
      sujeto,
      ubicacion,
      detalles: tipo.includes('PANIC') ? '¡BOTÓN DE PÁNICO ACTIVADO!' : detalles,
      x, y, z,
      timestamp: serverTimestamp()
    });

    // Actualizar seguimiento en el mapa táctico si hay coordenadas
    if (x !== null && z !== null && sujeto !== 'Sistema') {
      await setDoc(doc(firestore, 'playerPositions', sujeto), {
        playerName: sujeto,
        x, y, z,
        lastUpdate: serverTimestamp()
      }, { merge: true });
    }

    return NextResponse.json({ success: true, id: eventRef.id });
  } catch (error: any) {
    // Respuesta 400 JSON estructurada para cualquier fallo de lectura o validación
    console.warn('[ERLC_WEBHOOK] Error procesando body o firma no reconocida.');
    return NextResponse.json(
      { status: 'error', message: 'Invalid Request Format or Signature' }, 
      { status: 400 }
    );
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
