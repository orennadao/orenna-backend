import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';

export interface WebSocketMessage {
  type: 'payment' | 'indexer' | 'verification' | 'analytics';
  event: string;
  data: any;
  timestamp: string;
  id: string;
}

export interface PaymentEvent {
  paymentId: string;
  status: string;
  paymentType: string;
  amount: string;
  chainId: number;
  txHash?: string;
  projectId: number;
}

export interface IndexerEvent {
  eventId: string;
  eventName: string;
  contractAddress: string;
  chainId: number;
  blockNumber: number;
  processed: boolean;
  error?: string;
}

export interface VerificationEvent {
  verificationResultId: number;
  liftTokenId: number;
  status: 'submitted' | 'processing' | 'completed' | 'failed' | 'expired';
  methodId: string;
  progress?: number;
  confidence?: number;
  message?: string;
}

export interface AnalyticsEvent {
  type: 'verification_metrics' | 'system_health' | 'queue_status';
  data: any;
}

export class WebSocketManager {
  private connections: Set<WebSocket> = new Set();
  private subscriptions: Map<WebSocket, Set<string>> = new Map();

  constructor(private app: FastifyInstance) {}

  addConnection(socket: WebSocket): void {
    if (!socket) {
      this.app.log.warn('Attempted to add undefined socket connection');
      return;
    }
    
    this.connections.add(socket);
    this.subscriptions.set(socket, new Set());

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(socket, message);
      } catch (error) {
        this.app.log.error({ error }, 'Failed to parse WebSocket message');
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    socket.on('close', () => {
      this.removeConnection(socket);
    });

    socket.on('error', (error) => {
      this.app.log.error({ error }, 'WebSocket error');
      this.removeConnection(socket);
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Orenna real-time updates',
      timestamp: new Date().toISOString()
    }));
  }

  removeConnection(socket: WebSocket): void {
    this.connections.delete(socket);
    this.subscriptions.delete(socket);
  }

  private handleClientMessage(socket: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(socket, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(socket, message);
        break;
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        socket.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`
        }));
    }
  }

  private handleSubscribe(socket: WebSocket, message: any): void {
    const { channel } = message;
    if (!channel || typeof channel !== 'string') {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid channel specified'
      }));
      return;
    }

    const validChannels = [
      'payments',
      'payments:*',
      'indexer',
      'indexer:*',
      'verification',
      'verification:*',
      'analytics',
      'analytics:*',
      'payments:project:*',
      'indexer:chain:*',
      'verification:lift-token:*',
      'verification:method:*'
    ];

    // Basic channel validation
    const isValid = validChannels.some(pattern => 
      pattern === channel || 
      (pattern.endsWith('*') && channel.startsWith(pattern.slice(0, -1)))
    );

    if (!isValid) {
      socket.send(JSON.stringify({
        type: 'error',
        message: `Invalid channel: ${channel}`
      }));
      return;
    }

    const subscriptions = this.subscriptions.get(socket);
    if (subscriptions) {
      subscriptions.add(channel);
      socket.send(JSON.stringify({
        type: 'subscribed',
        channel,
        timestamp: new Date().toISOString()
      }));
      this.app.log.info({ channel }, 'Client subscribed to channel');
    }
  }

  private handleUnsubscribe(socket: WebSocket, message: any): void {
    const { channel } = message;
    const subscriptions = this.subscriptions.get(socket);
    
    if (subscriptions && channel) {
      subscriptions.delete(channel);
      socket.send(JSON.stringify({
        type: 'unsubscribed',
        channel,
        timestamp: new Date().toISOString()
      }));
      this.app.log.info({ channel }, 'Client unsubscribed from channel');
    }
  }

  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    
    for (const socket of this.connections) {
      if (socket.readyState === WebSocket.OPEN) {
        const subscriptions = this.subscriptions.get(socket);
        if (subscriptions && this.shouldReceiveMessage(subscriptions, message)) {
          socket.send(messageStr);
        }
      }
    }
  }

  private shouldReceiveMessage(subscriptions: Set<string>, message: WebSocketMessage): boolean {
    // Check for exact channel matches
    if (subscriptions.has(message.type)) {
      return true;
    }

    // Check for wildcard subscriptions
    if (subscriptions.has(`${message.type}:*`)) {
      return true;
    }

    // Check for specific project/chain subscriptions
    if (message.type === 'payment' && message.data.projectId) {
      if (subscriptions.has(`payments:project:${message.data.projectId}`)) {
        return true;
      }
    }

    if (message.type === 'indexer' && message.data.chainId) {
      if (subscriptions.has(`indexer:chain:${message.data.chainId}`)) {
        return true;
      }
    }

    // Check for verification-specific subscriptions
    if (message.type === 'verification') {
      if (message.data.liftTokenId && subscriptions.has(`verification:lift-token:${message.data.liftTokenId}`)) {
        return true;
      }
      if (message.data.methodId && subscriptions.has(`verification:method:${message.data.methodId}`)) {
        return true;
      }
    }

    return false;
  }

  // Emit payment events
  emitPaymentEvent(event: string, data: PaymentEvent): void {
    const message: WebSocketMessage = {
      type: 'payment',
      event,
      data,
      timestamp: new Date().toISOString(),
      id: `payment_${data.paymentId}_${Date.now()}`
    };

    this.broadcast(message);
    this.app.log.info({ event, paymentId: data.paymentId }, 'Payment event emitted');
  }

  // Emit indexer events
  emitIndexerEvent(event: string, data: IndexerEvent): void {
    const message: WebSocketMessage = {
      type: 'indexer',
      event,
      data,
      timestamp: new Date().toISOString(),
      id: `indexer_${data.eventId}_${Date.now()}`
    };

    this.broadcast(message);
    this.app.log.info({ event, eventId: data.eventId }, 'Indexer event emitted');
  }

  // Emit verification events
  emitVerificationEvent(event: string, data: VerificationEvent): void {
    const message: WebSocketMessage = {
      type: 'verification',
      event,
      data,
      timestamp: new Date().toISOString(),
      id: `verification_${data.verificationResultId}_${Date.now()}`
    };

    this.broadcast(message);
    this.app.log.info({ 
      event, 
      verificationResultId: data.verificationResultId,
      liftTokenId: data.liftTokenId,
      status: data.status
    }, 'Verification event emitted');
  }

  // Emit analytics events
  emitAnalyticsEvent(event: string, data: AnalyticsEvent): void {
    const message: WebSocketMessage = {
      type: 'analytics',
      event,
      data,
      timestamp: new Date().toISOString(),
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.broadcast(message);
    this.app.log.info({ event, analyticsType: data.type }, 'Analytics event emitted');
  }

  // Helper methods for verification events
  notifyVerificationStarted(verificationResultId: number, liftTokenId: number, methodId: string): void {
    this.emitVerificationEvent('verification_started', {
      verificationResultId,
      liftTokenId,
      methodId,
      status: 'processing',
      progress: 0,
      message: 'Verification process started'
    });
  }

  notifyVerificationProgress(verificationResultId: number, liftTokenId: number, methodId: string, progress: number, message?: string): void {
    this.emitVerificationEvent('verification_progress', {
      verificationResultId,
      liftTokenId,
      methodId,
      status: 'processing',
      progress,
      message
    });
  }

  notifyVerificationCompleted(verificationResultId: number, liftTokenId: number, methodId: string, success: boolean, confidence?: number): void {
    this.emitVerificationEvent('verification_completed', {
      verificationResultId,
      liftTokenId,
      methodId,
      status: success ? 'completed' : 'failed',
      progress: 100,
      confidence,
      message: success ? 'Verification completed successfully' : 'Verification failed'
    });
  }

  notifyAnalyticsUpdate(type: AnalyticsEvent['type'], data: any): void {
    this.emitAnalyticsEvent('analytics_update', {
      type,
      data
    });
  }

  // Get connection stats
  getStats(): { connections: number; totalSubscriptions: number } {
    let totalSubscriptions = 0;
    for (const subscriptions of this.subscriptions.values()) {
      totalSubscriptions += subscriptions.size;
    }

    return {
      connections: this.connections.size,
      totalSubscriptions
    };
  }

  // Cleanup inactive connections
  cleanup(): void {
    for (const socket of this.connections) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        this.removeConnection(socket);
      }
    }
  }
}