import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { DisbursementService } from '../lib/disbursement';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
import { logger } from '../utils/logger';

// Request/Response schemas
const PaymentDataSchema = Type.Object({
  method: Type.Union([
    Type.Literal('ACH'),
    Type.Literal('USDC'),
    Type.Literal('SAFE_MULTISIG'),
  ]),
  recipientAddress: Type.Optional(Type.String()),
  bankDetails: Type.Optional(Type.Object({
    routingNumber: Type.String({ minLength: 9, maxLength: 9 }),
    accountNumber: Type.String({ minLength: 1, maxLength: 17 }),
    accountType: Type.Union([Type.Literal('CHECKING'), Type.Literal('SAVINGS')]),
    bankName: Type.String({ minLength: 1, maxLength: 100 }),
  })),
  safeDetails: Type.Optional(Type.Object({
    safeAddress: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
    chainId: Type.Number(),
    threshold: Type.Number({ minimum: 1 }),
  })),
  memo: Type.Optional(Type.String({ maxLength: 500 })),
  reference: Type.Optional(Type.String({ maxLength: 100 })),
});

const CreatePaymentRunSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
  invoiceIds: Type.Array(Type.Number()),
  scheduledDate: Type.Optional(Type.String({ format: 'date' })),
});

const ReconcilePaymentSchema = Type.Object({
  bankReference: Type.String({ minLength: 1, maxLength: 100 }),
});

const MatchTransactionSchema = Type.Object({
  transactionHash: Type.String({ pattern: '^0x[a-fA-F0-9]{64}$' }),
});

const DateRangeSchema = Type.Object({
  startDate: Type.String({ format: 'date' }),
  endDate: Type.String({ format: 'date' }),
});

// Response schemas
const DisbursementResponseSchema = Type.Object({
  id: Type.Number(),
  invoiceId: Type.Number(),
  amount: Type.String(),
  currency: Type.String(),
  method: Type.String(),
  status: Type.String(),
  type: Type.String(),
  recipientAddress: Type.Union([Type.String(), Type.Null()]),
  bankRoutingNumber: Type.Union([Type.String(), Type.Null()]),
  bankAccountNumber: Type.Union([Type.String(), Type.Null()]),
  bankAccountType: Type.Union([Type.String(), Type.Null()]),
  bankName: Type.Union([Type.String(), Type.Null()]),
  safeAddress: Type.Union([Type.String(), Type.Null()]),
  safeChainId: Type.Union([Type.Number(), Type.Null()]),
  safeThreshold: Type.Union([Type.Number(), Type.Null()]),
  memo: Type.Union([Type.String(), Type.Null()]),
  reference: Type.Union([Type.String(), Type.Null()]),
  transactionHash: Type.Union([Type.String(), Type.Null()]),
  bankReference: Type.Union([Type.String(), Type.Null()]),
  blockNumber: Type.Union([Type.Number(), Type.Null()]),
  gasUsed: Type.Union([Type.String(), Type.Null()]),
  confirmations: Type.Union([Type.Number(), Type.Null()]),
  signatures: Type.Union([Type.Number(), Type.Null()]),
  retryCount: Type.Union([Type.Number(), Type.Null()]),
  error: Type.Union([Type.String(), Type.Null()]),
  scheduledAt: Type.Union([Type.String(), Type.Null()]),
  processedAt: Type.Union([Type.String(), Type.Null()]),
  confirmedAt: Type.Union([Type.String(), Type.Null()]),
  reconciledAt: Type.Union([Type.String(), Type.Null()]),
  notificationSentAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  invoice: Type.Object({
    id: Type.Number(),
    invoiceNumber: Type.String(),
    netPayableCents: Type.String(),
  }),
});

const BatchResultSchema = Type.Object({
  paymentRunId: Type.String(),
  totalDisbursements: Type.Number(),
  successfulPayments: Type.Number(),
  failedPayments: Type.Number(),
  totalAmount: Type.String(),
  results: Type.Array(Type.Object({
    disbursementId: Type.Number(),
    success: Type.Boolean(),
    transactionHash: Type.Union([Type.String(), Type.Null()]),
    bankReference: Type.Union([Type.String(), Type.Null()]),
    error: Type.Union([Type.String(), Type.Null()]),
    processedAt: Type.String(),
  })),
});

const PaymentStatusSchema = Type.Object({
  disbursementId: Type.Number(),
  status: Type.String(),
  method: Type.String(),
  amount: Type.String(),
  recipient: Type.String(),
  transactionHash: Type.Union([Type.String(), Type.Null()]),
  bankReference: Type.Union([Type.String(), Type.Null()]),
  confirmations: Type.Union([Type.Number(), Type.Null()]),
  lastChecked: Type.String(),
  error: Type.Union([Type.String(), Type.Null()]),
});

const ReconciliationReportSchema = Type.Object({
  dateRange: Type.Object({
    startDate: Type.String(),
    endDate: Type.String(),
  }),
  totalDisbursements: Type.Number(),
  reconciledCount: Type.Number(),
  unreconciledCount: Type.Number(),
  totalAmount: Type.String(),
  reconciledAmount: Type.String(),
  unreconciledDisbursements: Type.Array(Type.Object({
    id: Type.Number(),
    amount: Type.String(),
    method: Type.String(),
    status: Type.String(),
    createdAt: Type.String(),
  })),
});

export async function financePaymentRoutes(fastify: FastifyInstance) {
  const disbursementService = new DisbursementService(prisma);

  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * Create payment run
   */
  fastify.post('/payment-runs', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Create a new payment run',
      body: CreatePaymentRunSchema,
      response: {
        201: Type.Object({
          id: Type.String(),
          name: Type.String(),
          description: Type.Union([Type.String(), Type.Null()]),
          status: Type.String(),
          totalInvoices: Type.Number(),
          totalAmount: Type.String(),
          scheduledDate: Type.Union([Type.String(), Type.Null()]),
          createdAt: Type.String(),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof CreatePaymentRunSchema.static }>, reply: FastifyReply) => {
    try {
      const { name, description, invoiceIds, scheduledDate } = request.body;

      logger.info('Creating payment run', { 
        name,
        invoiceCount: invoiceIds.length,
        scheduledDate,
        createdBy: request.user.id,
      });

      // Validate invoices are approved and ready for payment
      const invoices = await db.invoice.findMany({
        where: {
          id: { in: invoiceIds },
          status: { in: ['APPROVED', 'SCHEDULED'] },
        },
      });

      if (invoices.length !== invoiceIds.length) {
        throw new Error('Some invoices are not approved or not found');
      }

      const totalAmount = invoices.reduce((sum, inv) => sum + inv.netPayableCents, BigInt(0));

      // Create payment run
      const paymentRun = await db.paymentRun.create({
        data: {
          id: `PR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
          name,
          description,
          status: 'PENDING',
          totalInvoices: invoices.length,
          totalAmount,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
          createdBy: request.user.id,
        },
      });

      // Create disbursements for each invoice
      const disbursements = [];
      for (const invoice of invoices) {
        // Get vendor payment preferences
        const vendor = await db.vendor.findUnique({
          where: { id: invoice.vendorId },
        });

        if (!vendor) {
          throw new Error(`Vendor ${invoice.vendorId} not found`);
        }

        const disbursement = await db.disbursement.create({
          data: {
            invoiceId: invoice.id,
            paymentRunId: paymentRun.id,
            amount: invoice.netPayableCents,
            currency: invoice.currency || 'USD',
            method: vendor.preferredPaymentMethod || 'ACH',
            recipientAddress: vendor.cryptoAddress,
            bankRoutingNumber: vendor.bankRoutingNumber,
            bankAccountNumber: vendor.bankAccountNumber,
            bankAccountType: vendor.bankAccountType,
            bankName: vendor.bankName,
            safeAddress: vendor.safeAddress,
            safeChainId: vendor.safeChainId,
            safeThreshold: vendor.safeThreshold,
            memo: `Payment for invoice ${invoice.invoiceNumber}`,
            reference: `PR-${paymentRun.id}-INV-${invoice.id}`,
            status: 'PENDING',
            type: vendor.preferredPaymentMethod === 'ACH' ? 'ACH' :
                  vendor.preferredPaymentMethod === 'USDC' ? 'CRYPTO' :
                  vendor.preferredPaymentMethod === 'SAFE_MULTISIG' ? 'MULTISIG' : 'OTHER',
            scheduledAt: paymentRun.scheduledDate,
          },
        });

        disbursements.push(disbursement);
      }

      reply.code(201).send({
        id: paymentRun.id,
        name: paymentRun.name,
        description: paymentRun.description,
        status: paymentRun.status,
        totalInvoices: paymentRun.totalInvoices,
        totalAmount: paymentRun.totalAmount.toString(),
        scheduledDate: paymentRun.scheduledDate?.toISOString() || null,
        createdAt: paymentRun.createdAt.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create payment run', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Execute payment run
   */
  fastify.post('/payment-runs/:id/execute', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Execute payment run',
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: BatchResultSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Executing payment run', { paymentRunId: id, executedBy: request.user.id });

      const result = await disbursementService.executeBatchPayments(id);

      // Update payment run status
      await db.paymentRun.update({
        where: { id },
        data: {
          status: result.failedPayments > 0 ? 'PARTIALLY_EXECUTED' : 'EXECUTED',
          executedAt: new Date(),
          executedBy: request.user.id,
        },
      });

      reply.send({
        paymentRunId: result.paymentRunId,
        totalDisbursements: result.totalDisbursements,
        successfulPayments: result.successfulPayments,
        failedPayments: result.failedPayments,
        totalAmount: result.totalAmount.toString(),
        results: result.results.map(r => ({
          disbursementId: r.disbursementId,
          success: r.success,
          transactionHash: r.transactionHash || null,
          bankReference: r.bankReference || null,
          error: r.error || null,
          processedAt: r.processedAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.error('Failed to execute payment run', { error: error.message, paymentRunId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }
    }
  });

  /**
   * Create disbursement for invoice
   */
  fastify.post('/disbursements', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Create disbursement for invoice',
      body: Type.Object({
        invoiceId: Type.Number(),
        paymentData: PaymentDataSchema,
      }),
      response: {
        201: DisbursementResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Body: { 
      invoiceId: number; 
      paymentData: typeof PaymentDataSchema.static 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { invoiceId, paymentData } = request.body;

      logger.info('Creating disbursement', { 
        invoiceId,
        method: paymentData.method,
        createdBy: request.user.id,
      });

      const disbursement = await disbursementService.createDisbursement(invoiceId, paymentData);

      // Fetch disbursement with relations
      const disbursementWithRelations = await db.disbursement.findUnique({
        where: { id: disbursement.id },
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, netPayableCents: true },
          },
        },
      });

      reply.code(201).send({
        id: disbursementWithRelations!.id,
        invoiceId: disbursementWithRelations!.invoiceId,
        amount: disbursementWithRelations!.amount.toString(),
        currency: disbursementWithRelations!.currency,
        method: disbursementWithRelations!.method,
        status: disbursementWithRelations!.status,
        type: disbursementWithRelations!.type,
        recipientAddress: disbursementWithRelations!.recipientAddress,
        bankRoutingNumber: disbursementWithRelations!.bankRoutingNumber,
        bankAccountNumber: disbursementWithRelations!.bankAccountNumber,
        bankAccountType: disbursementWithRelations!.bankAccountType,
        bankName: disbursementWithRelations!.bankName,
        safeAddress: disbursementWithRelations!.safeAddress,
        safeChainId: disbursementWithRelations!.safeChainId,
        safeThreshold: disbursementWithRelations!.safeThreshold,
        memo: disbursementWithRelations!.memo,
        reference: disbursementWithRelations!.reference,
        transactionHash: disbursementWithRelations!.transactionHash,
        bankReference: disbursementWithRelations!.bankReference,
        blockNumber: disbursementWithRelations!.blockNumber,
        gasUsed: disbursementWithRelations!.gasUsed?.toString() || null,
        confirmations: disbursementWithRelations!.confirmations,
        signatures: disbursementWithRelations!.signatures,
        retryCount: disbursementWithRelations!.retryCount,
        error: disbursementWithRelations!.error,
        scheduledAt: disbursementWithRelations!.scheduledAt?.toISOString() || null,
        processedAt: disbursementWithRelations!.processedAt?.toISOString() || null,
        confirmedAt: disbursementWithRelations!.confirmedAt?.toISOString() || null,
        reconciledAt: disbursementWithRelations!.reconciledAt?.toISOString() || null,
        notificationSentAt: disbursementWithRelations!.notificationSentAt?.toISOString() || null,
        createdAt: disbursementWithRelations!.createdAt.toISOString(),
        updatedAt: disbursementWithRelations!.updatedAt.toISOString(),
        invoice: {
          id: disbursementWithRelations!.invoice.id,
          invoiceNumber: disbursementWithRelations!.invoice.invoiceNumber,
          netPayableCents: disbursementWithRelations!.invoice.netPayableCents.toString(),
        },
      });
    } catch (error) {
      logger.error('Failed to create disbursement', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Get disbursement status
   */
  fastify.get('/disbursements/:id/status', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Get disbursement payment status',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: PaymentStatusSchema,
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Checking disbursement status', { disbursementId: id });

      const status = await disbursementService.checkPaymentStatus(id);

      reply.send({
        disbursementId: status.disbursementId,
        status: status.status,
        method: status.method,
        amount: status.amount.toString(),
        recipient: status.recipient,
        transactionHash: status.transactionHash,
        bankReference: status.bankReference,
        confirmations: status.confirmations,
        lastChecked: status.lastChecked.toISOString(),
        error: status.error,
      });
    } catch (error) {
      logger.error('Failed to check disbursement status', { error: error.message, disbursementId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else {
        reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to check disbursement status',
        });
      }
    }
  });

  /**
   * Reconcile payment
   */
  fastify.post('/disbursements/:id/reconcile', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Reconcile payment with bank reference',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: ReconcilePaymentSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          status: Type.String(),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { id: number }; 
    Body: typeof ReconcilePaymentSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { bankReference } = request.body;

      logger.info('Reconciling payment', { 
        disbursementId: id, 
        bankReference,
        reconciledBy: request.user.id,
      });

      await disbursementService.reconcilePayment(id, bankReference);

      reply.send({
        message: 'Payment reconciled successfully',
        status: 'RECONCILED',
      });
    } catch (error) {
      logger.error('Failed to reconcile payment', { error: error.message, disbursementId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }
    }
  });

  /**
   * Match blockchain transaction
   */
  fastify.post('/disbursements/:id/match-transaction', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Match blockchain transaction to disbursement',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: MatchTransactionSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          status: Type.String(),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { id: number }; 
    Body: typeof MatchTransactionSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { transactionHash } = request.body;

      logger.info('Matching blockchain transaction', { 
        disbursementId: id, 
        transactionHash,
        matchedBy: request.user.id,
      });

      await disbursementService.matchBlockchainTransaction(id, transactionHash);

      reply.send({
        message: 'Blockchain transaction matched successfully',
        status: 'RECONCILED',
      });
    } catch (error) {
      logger.error('Failed to match blockchain transaction', { error: error.message, disbursementId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }
    }
  });

  /**
   * Generate reconciliation report
   */
  fastify.post('/reconciliation/report', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Generate reconciliation report',
      body: DateRangeSchema,
      response: {
        200: ReconciliationReportSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof DateRangeSchema.static }>, reply: FastifyReply) => {
    try {
      const { startDate, endDate } = request.body;

      logger.info('Generating reconciliation report', { 
        startDate, 
        endDate,
        requestedBy: request.user.id,
      });

      const dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const report = await disbursementService.generateReconciliationReport(dateRange);

      reply.send({
        dateRange: {
          startDate: report.dateRange.startDate.toISOString(),
          endDate: report.dateRange.endDate.toISOString(),
        },
        totalDisbursements: report.totalDisbursements,
        reconciledCount: report.reconciledCount,
        unreconciledCount: report.unreconciledCount,
        totalAmount: report.totalAmount.toString(),
        reconciledAmount: report.reconciledAmount.toString(),
        unreconciledDisbursements: report.unreconciledDisbursements.map(d => ({
          id: d.id,
          amount: d.amount.toString(),
          method: d.method,
          status: d.status,
          createdAt: d.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.error('Failed to generate reconciliation report', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Retry failed payments
   */
  fastify.post('/disbursements/retry-failed', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Retry failed payments',
      response: {
        200: Type.Object({
          message: Type.String(),
          results: Type.Array(Type.Object({
            disbursementId: Type.Number(),
            previousStatus: Type.String(),
            newStatus: Type.String(),
            success: Type.Boolean(),
            error: Type.Union([Type.String(), Type.Null()]),
          })),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Retrying failed payments', { requestedBy: request.user.id });

      const results = await disbursementService.retryFailedPayments();

      reply.send({
        message: 'Failed payment retry completed',
        results: results.map(r => ({
          disbursementId: r.disbursementId,
          previousStatus: r.previousStatus,
          newStatus: r.newStatus,
          success: r.success,
          error: r.error || null,
        })),
      });
    } catch (error) {
      logger.error('Failed to retry failed payments', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retry failed payments',
      });
    }
  });

  /**
   * Send payment notifications
   */
  fastify.post('/disbursements/:id/notify', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Send payment notifications',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Sending payment notifications', { 
        disbursementId: id,
        requestedBy: request.user.id,
      });

      await disbursementService.sendPaymentNotifications(id);

      reply.send({
        message: 'Payment notifications sent successfully',
      });
    } catch (error) {
      logger.error('Failed to send payment notifications', { error: error.message, disbursementId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else {
        reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to send payment notifications',
        });
      }
    }
  });

  /**
   * Get all payment runs
   */
  fastify.get('/payment-runs', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Get all payment runs',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          paymentRuns: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String(),
            description: Type.Union([Type.String(), Type.Null()]),
            status: Type.String(),
            totalInvoices: Type.Number(),
            totalAmount: Type.String(),
            scheduledDate: Type.Union([Type.String(), Type.Null()]),
            executedAt: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            createdBy: Type.String(),
          })),
          pagination: Type.Object({
            page: Type.Number(),
            limit: Type.Number(),
            total: Type.Number(),
            totalPages: Type.Number(),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      page?: number; 
      limit?: number; 
      status?: string; 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, status } = request.query;

      logger.info('Fetching payment runs', { page, limit, status });

      const filters: any = {};
      if (status) filters.status = status;

      const [paymentRuns, total] = await Promise.all([
        db.paymentRun.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.paymentRun.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / limit);

      reply.send({
        paymentRuns: paymentRuns.map(pr => ({
          id: pr.id,
          name: pr.name,
          description: pr.description,
          status: pr.status,
          totalInvoices: pr.totalInvoices,
          totalAmount: pr.totalAmount.toString(),
          scheduledDate: pr.scheduledDate?.toISOString() || null,
          executedAt: pr.executedAt?.toISOString() || null,
          createdAt: pr.createdAt.toISOString(),
          createdBy: pr.createdBy,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch payment runs', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch payment runs',
      });
    }
  });

  /**
   * Get disbursements for payment run
   */
  fastify.get('/payment-runs/:id/disbursements', {
    schema: {
      tags: ['Finance Payments'],
      summary: 'Get disbursements for payment run',
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: Type.Array(DisbursementResponseSchema),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Fetching disbursements for payment run', { paymentRunId: id });

      const disbursements = await db.disbursement.findMany({
        where: { paymentRunId: id },
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, netPayableCents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      reply.send(disbursements.map(d => ({
        id: d.id,
        invoiceId: d.invoiceId,
        amount: d.amount.toString(),
        currency: d.currency,
        method: d.method,
        status: d.status,
        type: d.type,
        recipientAddress: d.recipientAddress,
        bankRoutingNumber: d.bankRoutingNumber,
        bankAccountNumber: d.bankAccountNumber,
        bankAccountType: d.bankAccountType,
        bankName: d.bankName,
        safeAddress: d.safeAddress,
        safeChainId: d.safeChainId,
        safeThreshold: d.safeThreshold,
        memo: d.memo,
        reference: d.reference,
        transactionHash: d.transactionHash,
        bankReference: d.bankReference,
        blockNumber: d.blockNumber,
        gasUsed: d.gasUsed?.toString() || null,
        confirmations: d.confirmations,
        signatures: d.signatures,
        retryCount: d.retryCount,
        error: d.error,
        scheduledAt: d.scheduledAt?.toISOString() || null,
        processedAt: d.processedAt?.toISOString() || null,
        confirmedAt: d.confirmedAt?.toISOString() || null,
        reconciledAt: d.reconciledAt?.toISOString() || null,
        notificationSentAt: d.notificationSentAt?.toISOString() || null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        invoice: {
          id: d.invoice.id,
          invoiceNumber: d.invoice.invoiceNumber,
          netPayableCents: d.invoice.netPayableCents.toString(),
        },
      })));
    } catch (error) {
      logger.error('Failed to fetch disbursements for payment run', { error: error.message, paymentRunId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch disbursements',
      });
    }
  });
}