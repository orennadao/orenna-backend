// apps/api/src/routes/websocket.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocketManager } from '../lib/websocket-manager.js';

export default async function websocketRoutes(app: FastifyInstance) {
  // Create global WebSocket manager instance
  const wsManager = new WebSocketManager(app);
  
  // Make it available to other parts of the application
  app.decorate('wsManager', wsManager);

  // WebSocket endpoint for real-time updates
  app.register(async function (app) {
    app.get('/ws', { websocket: true }, (connection, req) => {
      app.log.info('New WebSocket connection established');
      if (connection && connection.socket) {
        wsManager.addConnection(connection.socket);
      } else {
        app.log.error('WebSocket connection or socket is undefined');
      }
    });
  });

  // HTTP endpoint to get WebSocket connection stats
  app.get('/ws/stats', {
    schema: {
      description: 'Get WebSocket connection statistics',
      tags: ['WebSocket'],
      response: {
        200: {
          type: 'object',
          properties: {
            connections: { type: 'number' },
            totalSubscriptions: { type: 'number' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const stats = wsManager.getStats();
    return {
      ...stats,
      timestamp: new Date().toISOString()
    };
  });

  // HTTP endpoint to broadcast test messages (for development)
  app.post('/ws/test/broadcast', {
    schema: {
      description: 'Broadcast test message (development only)',
      tags: ['WebSocket', 'Testing'],
      body: {
        type: 'object',
        required: ['type', 'event', 'data'],
        properties: {
          type: { type: 'string', enum: ['payment', 'indexer', 'verification', 'analytics'] },
          event: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.code(403).send({ error: 'Test endpoints not available in production' });
    }

    const { type, event, data } = request.body as {
      type: 'payment' | 'indexer' | 'verification' | 'analytics';
      event: string;
      data: any;
    };

    if (type === 'payment') {
      wsManager.emitPaymentEvent(event, {
        paymentId: data.paymentId || 'test-payment',
        status: data.status || 'pending',
        paymentType: data.paymentType || 'LIFT_UNIT_PURCHASE',
        amount: data.amount || '1000000000000000000',
        chainId: data.chainId || 1,
        projectId: data.projectId || 1,
        ...data
      });
    } else if (type === 'indexer') {
      wsManager.emitIndexerEvent(event, {
        eventId: data.eventId || 'test-event',
        eventName: data.eventName || 'TestEvent',
        contractAddress: data.contractAddress || '0x1234567890123456789012345678901234567890',
        chainId: data.chainId || 1,
        blockNumber: data.blockNumber || 18000000,
        processed: data.processed ?? true,
        ...data
      });
    } else if (type === 'verification') {
      wsManager.emitVerificationEvent(event, {
        verificationResultId: data.verificationResultId || 1,
        liftTokenId: data.liftTokenId || 1,
        methodId: data.methodId || 'vwba-v2',
        status: data.status || 'processing',
        progress: data.progress || 50,
        confidence: data.confidence || 0.85,
        message: data.message || 'Test verification update',
        ...data
      });
    } else if (type === 'analytics') {
      wsManager.emitAnalyticsEvent(event, {
        type: data.analyticsType || 'verification_metrics',
        data: data.analyticsData || { test: true }
      });
    }

    return { success: true, message: 'Test message broadcasted' };
  });

  // Verification-specific WebSocket endpoints
  app.post('/ws/verification/notify', {
    schema: {
      description: 'Send verification status notification',
      tags: ['WebSocket', 'Verification'],
      body: {
        type: 'object',
        required: ['verificationResultId', 'liftTokenId', 'status'],
        properties: {
          verificationResultId: { type: 'number' },
          liftTokenId: { type: 'number' },
          methodId: { type: 'string' },
          status: { type: 'string', enum: ['submitted', 'processing', 'completed', 'failed', 'expired'] },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          message: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const data = request.body as {
      verificationResultId: number;
      liftTokenId: number;
      methodId?: string;
      status: 'submitted' | 'processing' | 'completed' | 'failed' | 'expired';
      progress?: number;
      confidence?: number;
      message?: string;
    };

    try {
      wsManager.emitVerificationEvent('verification_status_update', {
        verificationResultId: data.verificationResultId,
        liftTokenId: data.liftTokenId,
        methodId: data.methodId || 'unknown',
        status: data.status,
        progress: data.progress,
        confidence: data.confidence,
        message: data.message
      });

      return { success: true, message: 'Verification notification sent' };
    } catch (error) {
      app.log.error('Failed to send verification notification:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send verification notification'
      });
    }
  });

  // Analytics notification endpoint
  app.post('/ws/analytics/notify', {
    schema: {
      description: 'Send analytics update notification',
      tags: ['WebSocket', 'Analytics'],
      body: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { type: 'string', enum: ['verification_metrics', 'system_health', 'queue_status'] },
          data: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { type, data } = request.body as {
      type: 'verification_metrics' | 'system_health' | 'queue_status';
      data: any;
    };

    try {
      wsManager.emitAnalyticsEvent('analytics_update', { type, data });

      return { success: true, message: 'Analytics notification sent' };
    } catch (error) {
      app.log.error('Failed to send analytics notification:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send analytics notification'
      });
    }
  });

  // Cleanup inactive connections periodically
  const cleanupInterval = setInterval(() => {
    wsManager.cleanup();
  }, 30000); // Every 30 seconds

  // Cleanup on app close
  app.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });
}