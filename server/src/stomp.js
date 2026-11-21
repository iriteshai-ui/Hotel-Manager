import sockjs from 'sockjs';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { db } from './db.js';

function parseFrames(data) {
  const frames = [];
  const parts = data.split('\0');
  for (let i = 0; i < parts.length - 1; i++) {
    const raw = parts[i].replace(/^\r?\n+/, '');
    if (!raw) continue;
    const splitIndex = raw.search(/\r?\n\r?\n/);
    let headersStr = raw;
    let body = '';
    if (splitIndex !== -1) {
      headersStr = raw.slice(0, splitIndex);
      const match = raw.slice(splitIndex).match(/^\r?\n\r?\n/);
      body = raw.slice(splitIndex + (match ? match[0].length : 2));
    }
    const lines = headersStr.split(/\r?\n/);
    const command = lines[0].trim();
    const headers = {};
    for (let j = 1; j < lines.length; j++) {
      const colonIdx = lines[j].indexOf(':');
      if (colonIdx !== -1) {
        const key = lines[j].slice(0, colonIdx).trim();
        const val = lines[j].slice(colonIdx + 1).trim();
        if (!(key in headers)) headers[key] = val;
      }
    }
    frames.push({ command, headers, body });
  }
  return frames;
}

function createFrame(command, headers = {}, body = '') {
  let frame = `${command}\n`;
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += `\n${body}\0`;
  return frame;
}

class StompBroker {
  constructor() {
    this.connections = new Set();
  }

  setup(httpServer) {
    // 1. SockJS server
    const sockServer = sockjs.createServer({
      prefix: '/ws',
      log: () => {}
    });

    sockServer.on('connection', (conn) => {
      this.handleClient(conn, (msg) => conn.write(msg), () => conn.close());
      conn.on('data', (message) => {
        conn._onData && conn._onData(message);
      });
      conn.on('close', () => {
        conn._onClose && conn._onClose();
      });
    });

    sockServer.installHandlers(httpServer, { prefix: '/ws' });

    // 2. Fallback native WebSocket server at /stomp-ws
    const wss = new WebSocketServer({ noServer: true });
    httpServer.on('upgrade', (request, socket, head) => {
      if (request.url === '/stomp-ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleClient(ws, (msg) => ws.send(msg), () => ws.close());
          ws.on('message', (message) => {
            ws._onData && ws._onData(message.toString());
          });
          ws.on('close', () => {
            ws._onClose && ws._onClose();
          });
        });
      }
    });

    console.log('✓ STOMP Broker listening at /ws (SockJS) and /stomp-ws (WebSocket)');
  }

  handleClient(clientObj, sendFn, closeFn) {
    const connState = {
      id: crypto.randomUUID(),
      send: sendFn,
      close: closeFn,
      subscriptions: new Map() // subId -> destination
    };

    clientObj._onData = (message) => {
      this.processIncoming(connState, message);
    };

    clientObj._onClose = () => {
      this.connections.delete(connState);
    };

    this.connections.add(connState);
  }

  async processIncoming(conn, message) {
    // If it's a heartbeat (newline)
    if (message === '\n' || message === '\r\n') {
      conn.send('\n');
      return;
    }

    const frames = parseFrames(message);
    for (const frame of frames) {
      await this.handleFrame(conn, frame);
    }
  }

  async handleFrame(conn, frame) {
    const { command, headers, body } = frame;

    switch (command) {
      case 'CONNECT':
      case 'STOMP': {
        const response = createFrame('CONNECTED', {
          version: '1.2',
          'heart-beat': '10000,10000'
        });
        conn.send(response);
        break;
      }

      case 'SUBSCRIBE': {
        const dest = headers.destination;
        const subId = headers.id;
        if (dest && subId) {
          conn.subscriptions.set(subId, dest);
        }
        break;
      }

      case 'UNSUBSCRIBE': {
        const subId = headers.id;
        if (subId) {
          conn.subscriptions.delete(subId);
        }
        break;
      }

      case 'SEND': {
        const dest = headers.destination;
        let payload = null;
        try {
          payload = body ? JSON.parse(body) : {};
        } catch {
          payload = {};
        }

        if (dest === '/app/place_order') {
          const { tableNumber, items, hotelId } = payload;
          const newOrder = await db.placeOrder(tableNumber, items, hotelId || null);

          // Broadcast order_added
          this.broadcast('/topic/order_added', newOrder);

          // Broadcast table_updated
          const tableUpdate = {
            id: `t${tableNumber}`,
            number: tableNumber,
            name: `Table ${tableNumber}`,
            status: 'OCCUPIED',
            currentOrderId: newOrder.id,
            capacity: 4,
            hotelId: hotelId || null
          };
          this.broadcast('/topic/table_updated', tableUpdate);
        } else if (dest === '/app/update_order_status') {
          const { orderId, status } = payload;
          const updatedOrder = await db.updateOrderStatus(orderId, status);
          if (updatedOrder) {
            this.broadcast('/topic/order_updated', updatedOrder);

            if (status === 'PAID') {
              const tableUpdate = {
                id: `t${updatedOrder.tableNumber}`,
                number: updatedOrder.tableNumber,
                name: `Table ${updatedOrder.tableNumber}`,
                status: 'AVAILABLE',
                currentOrderId: null,
                capacity: 4
              };
              this.broadcast('/topic/table_updated', tableUpdate);
            }
          }
        }
        break;
      }

      case 'DISCONNECT': {
        if (headers.receipt) {
          conn.send(createFrame('RECEIPT', { 'receipt-id': headers.receipt }));
        }
        conn.close();
        break;
      }

      default:
        break;
    }
  }

  broadcast(destination, payload) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const conn of this.connections) {
      for (const [subId, dest] of conn.subscriptions.entries()) {
        if (dest === destination) {
          const frame = createFrame('MESSAGE', {
            destination,
            subscription: subId,
            'message-id': crypto.randomUUID(),
            'content-type': 'application/json'
          }, body);
          try {
            conn.send(frame);
          } catch (e) {
            console.error('Error broadcasting to client:', e.message);
          }
        }
      }
    }
  }
}

export const stompBroker = new StompBroker();

