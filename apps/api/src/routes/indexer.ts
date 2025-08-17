// apps/api/src/routes/indexer.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { BlockchainIndexer } from '../lib/indexer.js';

// Validation schemas
const StartIndexerSchema = z.object({
  configs: z.array(z.object({
    chainId: z.number().int().positive(),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
    indexerType: z.enum(['RepaymentEscrow', 'AllocationEscrow', 'LiftUnits']),
    startBlock: z.number().int().min(0).optional(),
    confirmations: z.number().int().min(1).max(100).optional(),
    batchSize: z.number().int().min(1).max(10000).optional()
  })).min(1)
});

const RetryFailedEventsSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100)
});

export default async function indexerRoutes(app: FastifyInstance) {
  // Global indexer instance
  let indexer: BlockchainIndexer | null = null;

  // Get indexer status
  app.get('/indexer/status', {
    schema: {
      description: 'Get blockchain indexer status',
      tags: ['Indexer'],
      response: {
        200: {
          type: 'object',
          properties: {
            isRunning: { type: 'boolean' },
            activeIndexers: { type: 'number' },
            states: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  chainId: { type: 'number' },
                  contractAddress: { type: 'string' },
                  indexerType: { type: 'string' },
                  lastBlockNumber: { type: 'number' },
                  lastSyncAt: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
                  errorCount: { type: 'number' },
                  lastError: { type: 'string', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      if (!indexer) {
        return {
          isRunning: false,
          activeIndexers: 0,
          states: []
        };
      }

      const status = await indexer.getIndexerStatus();
      return status;
    } catch (error) {
      app.log.error({ error }, 'Failed to get indexer status');
      return reply.code(500).send({ error: 'Failed to get indexer status' });
    }
  });

  // Start indexing
  app.post('/indexer/start', async (request: FastifyRequest, reply) => {
    const { configs } = request.body as z.infer<typeof StartIndexerSchema>;

    try {
      if (!indexer) {
        indexer = new BlockchainIndexer(app);
      }

      await indexer.startIndexing(configs);

      app.log.info({ configs }, 'Blockchain indexing started');

      return {
        success: true,
        message: `Started indexing ${configs.length} contracts`,
        configs: configs.map(c => ({
          chainId: c.chainId,
          contractAddress: c.contractAddress,
          indexerType: c.indexerType
        }))
      };
    } catch (error) {
      app.log.error({ error, configs }, 'Failed to start indexing');
      return reply.code(500).send({
        success: false,
        error: 'Failed to start indexing',
        details: error.message
      });
    }
  });

  // Stop indexing
  app.post('/indexer/stop', {
    schema: {
      description: 'Stop blockchain indexing',
      tags: ['Indexer'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      if (indexer) {
        await indexer.stopIndexing();
        app.log.info('Blockchain indexing stopped');
      }

      return {
        success: true,
        message: 'Indexing stopped'
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to stop indexing');
      return reply.code(500).send({
        success: false,
        error: 'Failed to stop indexing'
      });
    }
  });

  // Retry failed events
  app.post('/indexer/retry-failed', async (request: FastifyRequest, reply) => {
    const { limit } = request.body as z.infer<typeof RetryFailedEventsSchema>;

    try {
      if (!indexer) {
        indexer = new BlockchainIndexer(app);
      }

      const result = await indexer.retryFailedEvents(limit);

      return {
        success: true,
        processed: result.processed,
        failed: result.failed,
        message: `Processed ${result.processed} events, ${result.failed} failed`
      };
    } catch (error) {
      app.log.error({ error, limit }, 'Failed to retry failed events');
      return reply.code(500).send({
        success: false,
        error: 'Failed to retry failed events'
      });
    }
  });

  // Get indexed events
  app.get('/indexer/events', {
    schema: {
      description: 'Get indexed blockchain events',
      tags: ['Indexer'],
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number' },
          contractAddress: { type: 'string' },
          eventName: { type: 'string' },
          processed: { type: 'boolean' },
          hasError: { type: 'boolean' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const {
      chainId,
      contractAddress,
      eventName,
      processed,
      hasError,
      limit = 50,
      offset = 0
    } = request.query as {
      chainId?: number;
      contractAddress?: string;
      eventName?: string;
      processed?: boolean;
      hasError?: boolean;
      limit?: number;
      offset?: number;
    };

    try {
      const where: any = {};
      if (chainId) where.chainId = chainId;
      if (contractAddress) where.contractAddress = contractAddress.toLowerCase();
      if (eventName) where.eventName = eventName;
      if (processed !== undefined) where.processed = processed;
      if (hasError !== undefined) {
        where.processingError = hasError ? { not: null } : null;
      }

      const [events, total] = await Promise.all([
        app.prisma.indexedEvent.findMany({
          where,
          orderBy: { blockNumber: 'desc' },
          take: Math.min(limit, 100),
          skip: offset
        }),
        app.prisma.indexedEvent.count({ where })
      ]);

      return {
        events,
        total,
        limit,
        offset
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to get indexed events');
      return reply.code(500).send({ error: 'Failed to get indexed events' });
    }
  });

  // Get specific indexed event
  app.get('/indexer/events/:eventId', {
    schema: {
      description: 'Get specific indexed event',
      tags: ['Indexer'],
      params: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { eventId } = request.params as { eventId: string };

    try {
      const event = await app.prisma.indexedEvent.findUnique({
        where: { id: eventId },
        include: {
          relatedPayment: {
            select: {
              id: true,
              paymentType: true,
              status: true,
              amount: true,
              payerAddress: true
            }
          }
        }
      });

      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }

      return event;
    } catch (error) {
      app.log.error({ error, eventId }, 'Failed to get indexed event');
      return reply.code(500).send({ error: 'Failed to get indexed event' });
    }
  });

  // Test endpoint to start default indexing configuration
  app.post('/indexer/start-default', {
    schema: {
      description: 'Start indexing with default configuration',
      tags: ['Indexer', 'Testing']
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      // Default configuration for testing
      const defaultConfigs = [
        {
          chainId: 1, // Mainnet
          contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`, // Example RepaymentEscrow
          indexerType: 'RepaymentEscrow' as const,
          startBlock: 18000000, // Recent block
          confirmations: 12,
          batchSize: 1000
        },
        {
          chainId: 1, // Mainnet
          contractAddress: '0x0987654321098765432109876543210987654321' as `0x${string}`, // Example AllocationEscrow
          indexerType: 'AllocationEscrow' as const,
          startBlock: 18000000, // Recent block
          confirmations: 12,
          batchSize: 1000
        }
      ];

      if (!indexer) {
        indexer = new BlockchainIndexer(app);
      }

      await indexer.startIndexing(defaultConfigs);

      return {
        success: true,
        message: 'Started indexing with default configuration',
        configs: defaultConfigs
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to start default indexing');
      return reply.code(500).send({
        success: false,
        error: 'Failed to start default indexing'
      });
    }
  });

  // Indexer health check
  app.get('/indexer/health', {
    schema: {
      description: 'Check indexer health',
      tags: ['Indexer'],
      response: {
        200: {
          type: 'object',
          properties: {
            healthy: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
            summary: {
              type: 'object',
              properties: {
                totalIndexers: { type: 'number' },
                activeIndexers: { type: 'number' },
                staleIndexers: { type: 'number' },
                errorIndexers: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const states = await app.prisma.indexerState.findMany();
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      let healthy = true;
      const issues: string[] = [];
      
      const summary = {
        totalIndexers: states.length,
        activeIndexers: 0,
        staleIndexers: 0,
        errorIndexers: 0
      };

      for (const state of states) {
        if (!state.isActive) {
          continue;
        }

        summary.activeIndexers++;

        // Check for errors
        if (state.errorCount > 0) {
          summary.errorIndexers++;
          issues.push(`Indexer ${state.indexerType} on chain ${state.chainId} has ${state.errorCount} errors`);
          healthy = false;
        }

        // Check for stale syncing
        if (state.lastSyncAt) {
          const timeSinceSync = now.getTime() - state.lastSyncAt.getTime();
          if (timeSinceSync > staleThreshold) {
            summary.staleIndexers++;
            issues.push(`Indexer ${state.indexerType} on chain ${state.chainId} hasn't synced for ${Math.round(timeSinceSync / 60000)} minutes`);
            healthy = false;
          }
        } else {
          summary.staleIndexers++;
          issues.push(`Indexer ${state.indexerType} on chain ${state.chainId} has never synced`);
          healthy = false;
        }
      }

      // Check if indexer service is running
      if (!indexer || !(indexer as any).isRunning) {
        healthy = false;
        issues.push('Indexer service is not running');
      }

      return {
        healthy,
        issues,
        summary
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to check indexer health');
      return reply.code(500).send({ error: 'Failed to check indexer health' });
    }
  });

  // Graceful shutdown hook
  app.addHook('onClose', async () => {
    if (indexer) {
      await indexer.stopIndexing();
    }
  });
}