import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const hostnameArgIndex = args.indexOf('--hostname');

const port = portArgIndex !== -1 ? parseInt(args[portArgIndex + 1]) : (parseInt(process.env.PORT || '3000'));
const hostname = hostnameArgIndex !== -1 ? args[hostnameArgIndex + 1] : '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const channelClients = new Map<string, Set<WebSocket & { _userId?: string; _channel?: string }>>();

  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url!, true);
    if (parsedUrl.pathname === '/ws/radio') {
      console.log(`[WS HTTP UPGRADE] path=/ws/radio upgrade=websocket`);
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws: WebSocket & { _userId?: string; _channel?: string }, req) => {
    console.log(`[WS][SERVER][OPEN] Nueva conexión entrante`);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'join_channel') {
          ws._userId = msg.from;
          ws._channel = msg.channel;
          if (!channelClients.has(msg.channel)) channelClients.set(msg.channel, new Set());
          channelClients.get(msg.channel)!.add(ws);
          console.log(`[WS][SERVER][JOIN] Agente ${msg.from} se unió a ${msg.channel}`);
          broadcastPeers(msg.channel);
        } else {
          // Relé de señalización dirigida (Directed signaling)
          const channel = ws._channel;
          if (channel && channelClients.has(channel)) {
            const clients = channelClients.get(channel)!;
            clients.forEach((client) => {
              if (msg.to) {
                // Enviar solo al destinatario específico
                if (client._userId === msg.to && client.readyState === WebSocket.OPEN) {
                  client.send(data.toString());
                }
              } else if (client !== ws && client.readyState === WebSocket.OPEN) {
                // Broadcast al resto (excepto al emisor)
                client.send(data.toString());
              }
            });
          }
        }
      } catch (err) {
        console.error('[WS][SERVER][ERROR] Error procesando mensaje:', err);
      }
    });

    ws.on('close', () => {
      const channel = ws._channel;
      if (channel && channelClients.has(channel)) {
        channelClients.get(channel)!.delete(ws);
        console.log(`[WS][SERVER][LEAVE] Un agente abandonó el canal ${channel}`);
        broadcastPeers(channel);
      }
    });
  });

  function broadcastPeers(channel: string) {
    const clients = channelClients.get(channel);
    if (!clients) return;
    const peers = Array.from(clients)
      .filter(c => c.readyState === WebSocket.OPEN && c._userId)
      .map(c => c._userId!);
      
    const updateMsg = JSON.stringify({ type: 'channel_peers_update', payload: { peers } });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(updateMsg);
    });
  }

  server.listen(port, hostname, () => {
    console.log(`> [SERVER] Listening on http://${hostname}:${port}`);
    console.log(`> [WS] WebSocket available on /ws/radio`);
  });
});
