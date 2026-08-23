
import { NextResponse } from 'next/server';

/**
 * Proxy API para evitar errores de Mixed Content en producción.
 * Realiza las peticiones a los servidores institucionales desde el servidor de Next.js.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json({ autorizado: false, error: 'Faltan parámetros' }, { status: 400 });
  }

  const baseUrl = 'http://nc.lynxnodes.es:25633';
  let url = '';

  switch (type) {
    case 'admin_vs':
      url = `${baseUrl}/rol_admin_vs?userId=${id}`;
      break;
    case 'rol_gral':
      url = `${baseUrl}/comprobar_rol?ID=${id}`;
      break;
    case '112':
      url = `${baseUrl}/comprobar_112?ID=${id}`;
      break;
    default:
      return NextResponse.json({ autorizado: false }, { status: 400 });
  }

  try {
    const res = await fetch(url, { 
      cache: 'no-store', 
      signal: AbortSignal.timeout(5000),
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    const text = await res.text();
    if (!text) return NextResponse.json({ autorizado: false });

    // Intentar parsear JSON, si falla devolver el texto
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ autorizado: text.includes('true'), raw: text });
    }
  } catch (error: any) {
    console.error(`[PROXY_ERROR] ${type}:`, error.message);
    return NextResponse.json({ 
      autorizado: false, 
      error: 'Servidor institucional inalcanzable desde la red' 
    });
  }
}
