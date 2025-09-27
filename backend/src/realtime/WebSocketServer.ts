import { WebSocketServer as WSServer } from 'ws';
import jwt from 'jsonwebtoken';
import { logInfo, logError } from '../utils/logger';
import { cacheHelpers } from '../config/redis';

interface WSClient {
  id: string;
  userId: string;
  channels: Set<string>;
  ws: any;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<string, WSClient> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WSServer({ port });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Authenticate connection
        const token = this.extractToken(req.headers.authorization);
        const userId = await this.authenticateToken(token);
        
        if (!userId) {
          ws.close(1008, 'Unauthorized');
          return;
        }

        // Register client
        const clientId = this.generateClientId();
        const client: WSClient = {
          id: clientId,
          userId,
          channels: new Set(),
          ws
        };

        this.clients.set(clientId, client);
        
        // Setup message handlers
        ws.on('message', (data) => this.handleMessage(client, data));
        ws.on('close', () => this.handleDisconnect(client));
        ws.on('error', (error) => logError('WebSocket error', error));

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          clientId,
          timestamp: new Date().toISOString()
        }));

        logInfo(`WebSocket client connected: ${clientId}`);
      } catch (error) {
        logError('WebSocket connection error', error as Error);
        ws.close(1008, 'Connection error');
      }
    });

    logInfo(`WebSocket server listening on port ${this.wss.options.port}`);
  }

  private handleMessage(client: WSClient, data: any) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.subscribeToChannel(client, message.channel);
          break;
        case 'unsubscribe':
          this.unsubscribeFromChannel(client, message.channel);
          break;
        case 'broadcast':
          this.broadcastToChannel(message.channel, message.data, client.id);
          break;
        case 'ping':
          client.ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      logError('Message handling error', error as Error);
    }
  }

  private handleDisconnect(client: WSClient) {
    this.clients.delete(client.id);
    logInfo(`WebSocket client disconnected: ${client.id}`);
  }

  private subscribeToChannel(client: WSClient, channel: string) {
    client.channels.add(channel);
    client.ws.send(JSON.stringify({
      type: 'subscribed',
      channel
    }));
  }

  private unsubscribeFromChannel(client: WSClient, channel: string) {
    client.channels.delete(channel);
    client.ws.send(JSON.stringify({
      type: 'unsubscribed',
      channel
    }));
  }

  public broadcastToChannel(channel: string, data: any, excludeClientId?: string) {
    const message = JSON.stringify({
      type: 'message',
      channel,
      data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      if (client.channels.has(channel) && client.id !== excludeClientId) {
        client.ws.send(message);
      }
    });
  }

  private extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    return null;
  }

  private async authenticateToken(token: string | null): Promise<string | null> {
    if (!token) return null;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      return decoded.userId;
    } catch {
      return null;
    }
  }

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }
}

export default WebSocketServer;
