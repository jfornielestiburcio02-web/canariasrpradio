
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * @fileOverview Endpoint personalizado para recibir y servir datos externos al Mapa.
 * POST: Recibe un evento (ej. Pánico de Roblox) y lo guarda en Firestore.
 * GET: Devuelve los últimos eventos registrados.
 */

export async function POST(req: Request) {
  try {
    const { firestore } = initializeFirebase();
    const body = await req.json();

    // Validar estructura básica
    if (!body.tipo || !body.sujeto) {
      return NextResponse.json({ error: 'Datos incompletos. Se requiere tipo y sujeto.' }, { status: 400 });
    }

    const docRef = await addDoc(collection(firestore, 'erlcEvents'), {
      tipo: body.tipo.toUpperCase(),
      sujeto: body.sujeto,
      ubicacion: body.ubicacion || 'Ubicación Desconocida',
      detalles: body.detalles || 'Sin detalles adicionales',
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { firestore } = initializeFirebase();
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
