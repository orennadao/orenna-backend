// apps/api/src/routes/payments.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { PaymentService, PaymentRequest } from '../lib/payment.js';

// Validation schemas
const InitiatePaymentSchema = z.object({
  projectId: z.number().int().positive(),
  paymentType: z.enum(['LIFT_UNIT_PURCHASE', 'PROJECT_FUNDING', 'REPAYMENT', 'PLATFORM_FEE', 'STEWARD_PAYMENT']),
  amount: z.string().regex(/^\d+$/, 'Amount must be numeric string'),
  paymentToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid payment token address'),
  payerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid payer address'),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  chainId: z.number().int().positive(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  
  // For lift unit purchases
  tokenIds: z.array(z.string().regex(/^\d+$/)).optional(),
  tokenAmounts: z.array(z.string().regex(/^\d+$/)).optional(),
  
  // For escrow configuration
  escrowConfig: z.object({
    forwardPrincipal: z.string().regex(/^\d+$/).optional(),
    repaymentCap: z.string().regex(/^\d+$/).optional(),
    platformFeeBps: z.number().int().min(0).max(10000).optional(),
    platformFeeCap: z.string().regex(/^\d+$/).optional(),
    funder: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    stewardOrPool: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    policy: z.number().int().min(0).max(2).optional()
  }).optional()
});

const ProcessLiftTokenPurchaseSchema = z.object({
  paymentId: z.string(),
  tokenIds: z.array(z.string().regex(/^\d+$/)),
  tokenAmounts: z.array(z.string().regex(/^\d+$/)),
  considerationRef: z.string().optional()
});

const NotifyProceedsSchema = z.object({
  paymentId: z.string(),
  considerationRef: z.string().optional()
});

const ConfigureEscrowSchema = z.object({
  projectId: z.number().int().positive(),
  chainId: z.number().int().positive(),
  config: z.object({
    forwardPrincipal: z.string().regex(/^\d+$/),
    repaymentCap: z.string().regex(/^\d+$/),
    platformFeeBps: z.number().int().min(0).max(10000),
    platformFeeCap: z.string().regex(/^\d+$/),
    funder: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    stewardOrPool: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    paymentToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    policy: z.number().int().min(0).max(2)
  })
});

export default async function paymentRoutes(app: FastifyInstance) {
  const paymentService = new PaymentService(app);

  // Initiate a new payment
  app.post('/payments/initiate', {
    schema: {
      description: 'Initiate a new payment',
      tags: ['Payments'],
      body: {
        type: 'object',
        required: ['projectId', 'paymentType', 'amount', 'paymentToken', 'payerAddress', 'recipientAddress', 'chainId'],
        properties: {
          projectId: { type: 'number' },
          paymentType: { type: 'string', enum: ['LIFT_UNIT_PURCHASE', 'PROJECT_FUNDING', 'REPAYMENT', 'PLATFORM_FEE', 'STEWARD_PAYMENT'] },
          amount: { type: 'string', pattern: '^\\d+$' },
          paymentToken: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          payerAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          recipientAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          chainId: { type: 'number' },
          description: { type: 'string' },
          metadata: { type: 'object' },
          tokenIds: { type: 'array', items: { type: 'string' } },
          tokenAmounts: { type: 'array', items: { type: 'string' } },
          escrowConfig: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            paymentId: { type: 'string' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const body = request.body as z.infer<typeof InitiatePaymentSchema>;

    try {
      const paymentRequest: PaymentRequest = {
        projectId: body.projectId,
        paymentType: body.paymentType,
        amount: body.amount,
        paymentToken: body.paymentToken as `0x${string}`,
        payerAddress: body.payerAddress as `0x${string}`,
        recipientAddress: body.recipientAddress as `0x${string}`,
        chainId: body.chainId,
        description: body.description,
        metadata: body.metadata,
        tokenIds: body.tokenIds,
        tokenAmounts: body.tokenAmounts,
        escrowConfig: body.escrowConfig ? {
          ...body.escrowConfig,
          funder: body.escrowConfig.funder as `0x${string}` | undefined,
          stewardOrPool: body.escrowConfig.stewardOrPool as `0x${string}` | undefined
        } : undefined
      };

      const result = await paymentService.initializePayment(paymentRequest);

      if (result.success) {
        return {
          success: true,
          paymentId: result.paymentId!,
          message: 'Payment initiated successfully'
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error!
        });
      }
    } catch (error) {
      app.log.error({ error, body }, 'Failed to initiate payment');
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Process lift unit purchase
  app.post('/payments/process-lift-purchase', async (request: FastifyRequest, reply) => {
    const { paymentId, tokenIds, tokenAmounts, considerationRef } = 
      request.body as z.infer<typeof ProcessLiftTokenPurchaseSchema>;

    try {
      const result = await paymentService.processLiftTokenPurchase(
        paymentId,
        tokenIds,
        tokenAmounts,
        considerationRef
      );

      if (result.success) {
        return {
          success: true,
          paymentId: result.paymentId!,
          txHash: result.txHash!,
          message: 'Lift unit purchase processed successfully'
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error!
        });
      }
    } catch (error) {
      app.log.error({ error, paymentId }, 'Failed to process lift unit purchase');
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Notify proceeds to escrow
  app.post('/payments/notify-proceeds', async (request: FastifyRequest, reply) => {
    const { paymentId, considerationRef } = 
      request.body as z.infer<typeof NotifyProceedsSchema>;

    try {
      const result = await paymentService.notifyProceedsToEscrow(
        paymentId,
        considerationRef
      );

      if (result.success) {
        return {
          success: true,
          paymentId: result.paymentId!,
          txHash: result.txHash!,
          message: 'Proceeds notified to escrow successfully'
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error!
        });
      }
    } catch (error) {
      app.log.error({ error, paymentId }, 'Failed to notify proceeds');
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Configure project escrow
  app.post('/payments/configure-escrow', async (request: FastifyRequest, reply) => {
    const { projectId, chainId, config } = 
      request.body as z.infer<typeof ConfigureEscrowSchema>;

    try {
      const result = await paymentService.configureProjectEscrow(
        projectId,
        {
          ...config,
          funder: config.funder as `0x${string}`,
          stewardOrPool: config.stewardOrPool as `0x${string}`,
          paymentToken: config.paymentToken as `0x${string}`
        },
        chainId
      );

      if (result.success) {
        return {
          success: true,
          txHash: result.txHash!,
          message: 'Project escrow configured successfully'
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error!
        });
      }
    } catch (error) {
      app.log.error({ error, projectId, config }, 'Failed to configure escrow');
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get payment status
  app.get('/payments/:paymentId', {
    schema: {
      description: 'Get payment status and details',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            paymentType: { type: 'string' },
            status: { type: 'string' },
            amount: { type: 'string' },
            paymentToken: { type: 'string' },
            chainId: { type: 'number' },
            payerAddress: { type: 'string' },
            recipientAddress: { type: 'string' },
            txHash: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string' },
            confirmedAt: { type: 'string', nullable: true }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { paymentId } = request.params as { paymentId: string };

    try {
      const payment = await paymentService.getPaymentStatus(paymentId);

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found' });
      }

      return payment;
    } catch (error) {
      app.log.error({ error, paymentId }, 'Failed to get payment status');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get project payments
  app.get('/payments/project/:projectId', {
    schema: {
      description: 'Get payments for a project',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          paymentType: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };
    const {
      status,
      paymentType,
      limit = 50,
      offset = 0
    } = request.query as {
      status?: string;
      paymentType?: string;
      limit?: number;
      offset?: number;
    };

    try {
      const result = await paymentService.getProjectPayments(
        Number(projectId),
        { status, paymentType, limit, offset }
      );

      return result;
    } catch (error) {
      app.log.error({ error, projectId }, 'Failed to get project payments');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get all payments (admin endpoint)
  app.get('/payments', {
    schema: {
      description: 'Get all payments (admin)',
      tags: ['Payments'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          paymentType: { type: 'string' },
          chainId: { type: 'number' },
          payerAddress: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const {
      status,
      paymentType,
      chainId,
      payerAddress,
      limit = 50,
      offset = 0
    } = request.query as {
      status?: string;
      paymentType?: string;
      chainId?: number;
      payerAddress?: string;
      limit?: number;
      offset?: number;
    };

    try {
      const where: any = {};
      if (status) where.status = status;
      if (paymentType) where.paymentType = paymentType;
      if (chainId) where.chainId = chainId;
      if (payerAddress) where.payerAddress = payerAddress.toLowerCase();

      const [payments, total] = await Promise.all([
        app.prisma.payment.findMany({
          where,
          include: {
            project: {
              select: { id: true, name: true, slug: true }
            },
            events: {
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 100),
          skip: offset
        }),
        app.prisma.payment.count({ where })
      ]);

      return {
        payments,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      app.log.error({ error, errorMessage: error?.message, errorStack: error?.stack }, 'Failed to get payments');
      return reply.code(500).send({ 
        error: 'Failed to fetch payments',
        details: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Unknown',
        code: error?.code || 'No code'
      });
    }
  });

  // Test endpoint to create a sample payment configuration
  app.post('/payments/test/create-project-config', {
    schema: {
      description: 'Create test payment configuration for a project',
      tags: ['Payments', 'Testing'],
      body: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' },
          allocationEscrow: { type: 'string', nullable: true },
          repaymentEscrow: { type: 'string', nullable: true }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { projectId, allocationEscrow, repaymentEscrow } = request.body as {
      projectId: number;
      allocationEscrow?: string;
      repaymentEscrow?: string;
    };

    try {
      const config = await app.prisma.projectPaymentConfig.upsert({
        where: { projectId },
        update: {
          allocationEscrow: allocationEscrow || undefined,
          repaymentEscrow: repaymentEscrow || undefined,
          acceptsPayments: true,
          paymentTokens: [
            '0x0000000000000000000000000000000000000000', // ETH
            '0xA0b86a33E6441C8C8b4cA1b23B977999Df8b0C1C' // USDC example
          ]
        },
        create: {
          projectId,
          allocationEscrow: allocationEscrow || '0x1234567890123456789012345678901234567890',
          repaymentEscrow: repaymentEscrow || '0x0987654321098765432109876543210987654321',
          acceptsPayments: true,
          paymentTokens: [
            '0x0000000000000000000000000000000000000000', // ETH
            '0xA0b86a33E6441C8C8b4cA1b23B977999Df8b0C1C' // USDC example
          ],
          platformFeeBps: 250, // 2.5%
          platformFeeCap: '1000000000000000000' // 1 ETH
        }
      });

      return {
        message: 'Project payment configuration created/updated',
        config: {
          id: config.id,
          projectId: config.projectId,
          acceptsPayments: config.acceptsPayments,
          allocationEscrow: config.allocationEscrow,
          repaymentEscrow: config.repaymentEscrow
        }
      };
    } catch (error) {
      app.log.error({ error, projectId }, 'Failed to create project payment config');
      return reply.code(500).send({
        error: 'Failed to create project payment config',
        details: error.message
      });
    }
  });

  // Webhook endpoint for external payment providers
  app.post('/payments/webhook/:provider', {
    schema: {
      description: 'Webhook endpoint for external payment providers',
      tags: ['Payments', 'Webhooks'],
      params: {
        type: 'object',
        required: ['provider'],
        properties: {
          provider: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { provider } = request.params as { provider: string };
    const payload = request.body;

    try {
      // Log webhook for debugging
      app.log.info({ provider, payload }, 'Payment webhook received');

      // Here you would implement webhook verification and processing
      // based on the payment provider (Stripe, Coinbase, etc.)
      
      switch (provider) {
        case 'stripe':
          // Handle Stripe webhook
          break;
        case 'coinbase':
          // Handle Coinbase webhook
          break;
        default:
          return reply.code(400).send({ error: 'Unsupported payment provider' });
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      app.log.error({ error, provider, payload }, 'Failed to process webhook');
      return reply.code(500).send({ error: 'Failed to process webhook' });
    }
  });
}