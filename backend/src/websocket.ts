import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log(`[WS] Client connected (total: ${wss!.clients.size})`);

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to DeadSwitch WebSocket',
      timestamp: Math.floor(Date.now() / 1000),
    }));

    ws.on('close', () => {
      console.log(`[WS] Client disconnected (total: ${wss!.clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });
  });

  console.log('[WS] WebSocket server initialized on /ws');
}

/**
 * Broadcast an event to all connected WebSocket clients.
 */
export function broadcast(data: object): void {
  if (!wss) return;

  const message = JSON.stringify(data);
  let sent = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[WS] Broadcast to ${sent} client(s): ${(data as any).type}`);
  }
}

export function getConnectionCount(): number {
  return wss ? wss.clients.size : 0;
}
