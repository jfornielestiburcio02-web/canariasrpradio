
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const hostnameArgIndex = args.indexOf('--hostname');

const dev = process.env.NODE_ENV !== 'production';
// Prioridad: Argumento --port > process.env.PORT > 6000 (fallback)
const port = portArgIndex !== -1 ? parseInt(args[portArgIndex + 1]) : (parseInt(process.env.PORT || '6000'));
// Escuchar en 0.0.0.0 para permitir el acceso desde el proxy de la workstation
const hostname = hostnameArgIndex !== -1 ? args[hostnameArgIndex + 1] : '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  // Gestión de clientes por canal de radio
  const channelClients = new Map<string, Set<WebSocket & { _userId?: string; _channel?: string }>>();

  // Manejador de Upgrade para WebSockets
  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url!, true);
    const pathname = parsedUrl.pathname;

    // DIAGNÓSTICO SOLICITADO POR EL USUARIO
    console.log(`[WS HTTP UPGRADE] path=${pathname}`);
    console.log(`[WS HTTP UPGRADE] headers-upgrade=${req.headers.upgrade}`);
    console.log(`[WS HTTP UPGRADE] connection=${req.headers.connection}`);

    if (pathname === '/ws/radio') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws: WebSocket & { _userId?: string; _channel?: string }, req) => {
    // DIAGNÓSTICO SOLICITADO: Conexión aceptada
    console.log(`[WS][SERVER][OPEN] New connection from ${req.socket.remoteAddress}`);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'join_channel') {
          const channel = msg.channel;
          const userId = msg.from;

          ws._userId = userId;
          ws._channel = channel;

          if (!channelClients.has(channel)) {
            channelClients.set(channel, new Set());
          }
          channelClients.get(channel)!.add(ws);

          console.log(`[WS][SERVER][JOIN] User ${userId} joined ${channel}`);
          broadcastPeers(channel);
        } else {
          // Relé de mensajes para WebRTC (ofertas, respuestas, ICE) y PTT
          const channel = ws._channel;
          if (channel && channelClients.has(channel)) {
            const clients = channelClients.get(channel)!;
            clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
              }
            });
          }
        }
      } catch (err) {
        console.error('[WS][SERVER][ERROR] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      const channel = ws._channel;
      const userId = ws._userId;
      if (channel && channelClients.has(channel)) {
        channelClients.get(channel)!.delete(ws);
        console.log(`[WS][SERVER][LEAVE] User ${userId} left ${channel}`);
        broadcastPeers(channel);
      }
    });

    ws.on('error', (err) => {
      console.error(`[WS][SERVER][ERROR] Session ${ws._userId}:`, err);
    });
  });

  function broadcastPeers(channel: string) {
    const clients = channelClients.get(channel);
    if (!clients) return;

    const peers = Array.from(clients)
      .filter(c => c.readyState === WebSocket.OPEN)
      .map(c => c._userId);

    const updateMsg = JSON.stringify({
      type: 'channel_peers_update',
      payload: { peers }
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updateMsg);
      }
    });
  }

  server.listen(port, hostname, () => {
    console.log(`> [WS][SERVER] Ready on http://${hostname}:${port}`);
    console.log(`> [WS][SERVER] Internal process listening on port ${port}`);
    console.log(`> [WS][SERVER] Handshake endpoint: /ws/radio`);
  });
});
