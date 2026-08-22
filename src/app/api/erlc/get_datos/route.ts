
import { NextResponse } from 'next/server';
import { dbRadio as firestore } from '@/lib/firebase-radio';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * @fileOverview Endpoint ultra-compatible para Webhooks de ERLC.
 * Mapea los campos automáticos de ERLC (Event, Player, Details) a nuestra estructura de Firestore.
 * Utiliza dbRadio (sin directiva 'use client') para permitir su ejecución en el servidor.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mapeo de campos: ERLC utiliza 'Event', 'Player' y 'Details' en su webhook de logs
    const tipo = (body.Event || body.tipo || 'INFO').toUpperCase();
    const sujeto = body.Player || body.sujeto || 'Sistema';
    const detalles = body.Details || body.detalles || 'Sin detalles';
    
    // Si es un botón de pánico, guardamos la ubicación si viene en los detalles o campos específicos
    const ubicacion = body.Location || body.ubicacion || (tipo === 'PANICBUTTON' || tipo === 'PANIC BUTTON' ? detalles : 'Ubicación Desconocida');

    const docRef = await addDoc(collection(firestore, 'erlcEvents'), {
      tipo,
      sujeto,
      ubicacion,
      detalles: (tipo === 'PANICBUTTON' || tipo === 'PANIC BUTTON') ? '¡BOTÓN DE PÁNICO ACTIVADO!' : detalles,
      timestamp: serverTimestamp()
    });

    console.log(`[ERLC_WEBHOOK] Evento registrado en el servidor: ${tipo} por ${sujeto}`);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[ERLC_WEBHOOK_ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const q = query(collection(firestore, 'erlcEvents'), orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
