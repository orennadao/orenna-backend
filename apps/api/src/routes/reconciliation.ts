import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { ReconciliationService, BankStatement, BlockchainTransaction } from '../lib/reconciliation';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
import { logger } from '../utils/logger';

// Request/Response schemas
const BankStatementSchema = Type.Object({
  transactionId: Type.String({ minLength: 1, maxLength: 100 }),
  date: Type.String({ format: 'date-time' }),
  amount: Type.Number({ minimum: 0 }),
  description: Type.String({ maxLength: 500 }),
  reference: Type.Optional(Type.String({ maxLength: 100 })),
  accountNumber: Type.String({ minLength: 1, maxLength: 20 }),
  routingNumber: Type.Optional(Type.String({ minLength: 9, maxLength: 9 })),
  type: Type.Union([Type.Literal('DEBIT'), Type.Literal('CREDIT')]),
  status: Type.Union([Type.Literal('PENDING'), Type.Literal('CLEARED'), Type.Literal('RETURNED')]),
});

const TokenTransferSchema = Type.Object({
  from: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  to: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  value: Type.String(),
  tokenAddress: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  tokenSymbol: Type.String({ maxLength: 10 }),
  tokenDecimals: Type.Number({ minimum: 0, maximum: 18 }),
});

const BlockchainTransactionSchema = Type.Object({
  hash: Type.String({ pattern: '^0x[a-fA-F0-9]{64}$' }),
  blockNumber: Type.Number({ minimum: 0 }),
  from: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  to: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  value: Type.String(),
  gasUsed: Type.String(),
  gasPrice: Type.String(),
  status: Type.Union([Type.Literal('SUCCESS'), Type.Literal('FAILED')]),
  timestamp: Type.String({ format: 'date-time' }),
  confirmations: Type.Number({ minimum: 0 }),
  tokenTransfers: Type.Optional(Type.Array(TokenTransferSchema)),
});

const ReconciliationSummarySchema = Type.Object({
  totalDisbursements: Type.Number(),
  reconciledCount: Type.Number(),
  pendingCount: Type.Number(),
  unreconciledCount: Type.Number(),
  autoReconciledCount: Type.Number(),
  manualReconciledCount: Type.Number(),
  requiresReviewCount: Type.Number(),
  totalAmount: Type.String(),
  reconciledAmount: Type.String(),
  processingStartTime: Type.String(),
  processingEndTime: Type.String(),
  processingDuration: Type.Number(),
});

const ApproveReviewSchema = Type.Object({
  reviewId: Type.Number(),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

const RejectReviewSchema = Type.Object({
  reviewId: Type.Number(),
  reason: Type.String({ minLength: 1, maxLength: 1000 }),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

export async function reconciliationRoutes(fastify: FastifyInstance) {
  const reconciliationService = new ReconciliationService(prisma);

  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * Upload and process bank statements for reconciliation
   */
  fastify.post('/bank-statements/reconcile', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Process bank statements for automatic reconciliation',
      body: Type.Object({
        statements: Type.Array(BankStatementSchema),
      }),
      response: {
        200: ReconciliationSummarySchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Body: { 
      statements: typeof BankStatementSchema.static[] 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { statements } = request.body;

      logger.info('Processing bank statements for reconciliation', { 
        statementCount: statements.length,
        processedBy: request.user.id,
      });

      // Convert date strings to Date objects
      const bankStatements: BankStatement[] = statements.map(stmt => ({
        ...stmt,
        date: new Date(stmt.date),
      }));

      const summary = await reconciliationService.reconcileBankStatements(bankStatements);

      reply.send({
        totalDisbursements: summary.totalDisbursements,
        reconciledCount: summary.reconciledCount,
        pendingCount: summary.pendingCount,
        unreconciledCount: summary.unreconciledCount,
        autoReconciledCount: summary.autoReconciledCount,
        manualReconciledCount: summary.manualReconciledCount,
        requiresReviewCount: summary.requiresReviewCount,
        totalAmount: summary.totalAmount.toString(),
        reconciledAmount: summary.reconciledAmount.toString(),
        processingStartTime: summary.processingStartTime.toISOString(),
        processingEndTime: summary.processingEndTime.toISOString(),
        processingDuration: summary.processingDuration,
      });
    } catch (error) {
      logger.error('Failed to process bank statements', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Upload and process blockchain transactions for reconciliation
   */
  fastify.post('/blockchain-transactions/reconcile', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Process blockchain transactions for automatic reconciliation',
      body: Type.Object({
        transactions: Type.Array(BlockchainTransactionSchema),
      }),
      response: {
        200: ReconciliationSummarySchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Body: { 
      transactions: typeof BlockchainTransactionSchema.static[] 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { transactions } = request.body;

      logger.info('Processing blockchain transactions for reconciliation', { 
        transactionCount: transactions.length,
        processedBy: request.user.id,
      });

      // Convert date strings to Date objects and format transaction data
      const blockchainTransactions: BlockchainTransaction[] = transactions.map(tx => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
      }));

      const summary = await reconciliationService.reconcileBlockchainTransactions(blockchainTransactions);

      reply.send({
        totalDisbursements: summary.totalDisbursements,
        reconciledCount: summary.reconciledCount,
        pendingCount: summary.pendingCount,
        unreconciledCount: summary.unreconciledCount,
        autoReconciledCount: summary.autoReconciledCount,
        manualReconciledCount: summary.manualReconciledCount,
        requiresReviewCount: summary.requiresReviewCount,
        totalAmount: summary.totalAmount.toString(),
        reconciledAmount: summary.reconciledAmount.toString(),
        processingStartTime: summary.processingStartTime.toISOString(),
        processingEndTime: summary.processingEndTime.toISOString(),
        processingDuration: summary.processingDuration,
      });
    } catch (error) {
      logger.error('Failed to process blockchain transactions', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Get pending reconciliation reviews
   */
  fastify.get('/reviews/pending', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Get pending reconciliation reviews',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        matchType: Type.Optional(Type.String()),
        minConfidence: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
      }),
      response: {
        200: Type.Object({
          reviews: Type.Array(Type.Object({
            id: Type.Number(),
            disbursementId: Type.Number(),
            matchType: Type.String(),
            matchConfidence: Type.Number(),
            externalReference: Type.String(),
            externalAmount: Type.Number(),
            amountDifference: Type.Number(),
            status: Type.String(),
            reviewReason: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            disbursement: Type.Object({
              id: Type.Number(),
              amount: Type.String(),
              method: Type.String(),
              reference: Type.Union([Type.String(), Type.Null()]),
              invoice: Type.Object({
                id: Type.Number(),
                invoiceNumber: Type.String(),
                contract: Type.Object({
                  vendor: Type.Object({
                    name: Type.String(),
                  }),
                }),
              }),
            }),
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
      matchType?: string;
      minConfidence?: number;
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, matchType, minConfidence } = request.query;

      logger.info('Fetching pending reconciliation reviews', { page, limit, matchType, minConfidence });

      const filters: any = { status: 'PENDING_REVIEW' };
      if (matchType) filters.matchType = matchType;
      if (minConfidence !== undefined) filters.matchConfidence = { gte: minConfidence };

      const [reviews, total] = await Promise.all([
        db.reconciliationReview.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            disbursement: {
              include: {
                invoice: {
                  include: {
                    contract: {
                      include: {
                        vendor: {
                          select: { name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        db.reconciliationReview.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / limit);

      reply.send({
        reviews: reviews.map(review => ({
          id: review.id,
          disbursementId: review.disbursementId,
          matchType: review.matchType,
          matchConfidence: review.matchConfidence,
          externalReference: review.externalReference,
          externalAmount: review.externalAmount,
          amountDifference: review.amountDifference,
          status: review.status,
          reviewReason: review.reviewReason,
          createdAt: review.createdAt.toISOString(),
          disbursement: {
            id: review.disbursement.id,
            amount: review.disbursement.amount.toString(),
            method: review.disbursement.method,
            reference: review.disbursement.reference,
            invoice: {
              id: review.disbursement.invoice.id,
              invoiceNumber: review.disbursement.invoice.invoiceNumber,
              contract: {
                vendor: {
                  name: review.disbursement.invoice.contract.vendor.name,
                },
              },
            },
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch pending reconciliation reviews', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch pending reconciliation reviews',
      });
    }
  });

  /**
   * Approve reconciliation review
   */
  fastify.post('/reviews/approve', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Approve reconciliation review',
      body: ApproveReviewSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          reviewId: Type.Number(),
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
  }, async (request: FastifyRequest<{ Body: typeof ApproveReviewSchema.static }>, reply: FastifyReply) => {
    try {
      const { reviewId, notes } = request.body;

      logger.info('Approving reconciliation review', { 
        reviewId,
        approvedBy: request.user.id,
        notes,
      });

      await reconciliationService.approveReconciliationReview(reviewId, request.user.id);

      reply.send({
        message: 'Reconciliation review approved successfully',
        reviewId,
      });
    } catch (error) {
      logger.error('Failed to approve reconciliation review', { error: error.message, reviewId: request.body.reviewId });
      
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
   * Reject reconciliation review
   */
  fastify.post('/reviews/reject', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Reject reconciliation review',
      body: RejectReviewSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          reviewId: Type.Number(),
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
  }, async (request: FastifyRequest<{ Body: typeof RejectReviewSchema.static }>, reply: FastifyReply) => {
    try {
      const { reviewId, reason, notes } = request.body;

      logger.info('Rejecting reconciliation review', { 
        reviewId,
        rejectedBy: request.user.id,
        reason,
        notes,
      });

      await reconciliationService.rejectReconciliationReview(reviewId, request.user.id, reason);

      reply.send({
        message: 'Reconciliation review rejected successfully',
        reviewId,
      });
    } catch (error) {
      logger.error('Failed to reject reconciliation review', { error: error.message, reviewId: request.body.reviewId });
      
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
   * Process pending reviews (auto-approve/reject based on rules)
   */
  fastify.post('/reviews/process-pending', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Process pending reviews with auto-approval/rejection',
      response: {
        200: Type.Object({
          message: Type.String(),
          processed: Type.Number(),
        }),
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Processing pending reconciliation reviews', { requestedBy: request.user.id });

      const beforeCount = await db.reconciliationReview.count({
        where: { status: 'PENDING_REVIEW' },
      });

      await reconciliationService.processPendingReviews();

      const afterCount = await db.reconciliationReview.count({
        where: { status: 'PENDING_REVIEW' },
      });

      const processed = beforeCount - afterCount;

      reply.send({
        message: 'Pending reviews processed successfully',
        processed,
      });
    } catch (error) {
      logger.error('Failed to process pending reviews', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to process pending reviews',
      });
    }
  });

  /**
   * Get reconciliation statistics
   */
  fastify.get('/statistics', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Get reconciliation statistics',
      querystring: Type.Object({
        startDate: Type.Optional(Type.String({ format: 'date' })),
        endDate: Type.Optional(Type.String({ format: 'date' })),
      }),
      response: {
        200: Type.Object({
          totalDisbursements: Type.Number(),
          reconciledCount: Type.Number(),
          reconciledPercentage: Type.Number(),
          autoReconciledCount: Type.Number(),
          manualReconciledCount: Type.Number(),
          pendingReviewCount: Type.Number(),
          unreconciledCount: Type.Number(),
          totalAmount: Type.String(),
          reconciledAmount: Type.String(),
          averageMatchConfidence: Type.Number(),
          reconciliationMethods: Type.Object({
            ACH: Type.Object({
              total: Type.Number(),
              reconciled: Type.Number(),
              percentage: Type.Number(),
            }),
            USDC: Type.Object({
              total: Type.Number(),
              reconciled: Type.Number(),
              percentage: Type.Number(),
            }),
            SAFE_MULTISIG: Type.Object({
              total: Type.Number(),
              reconciled: Type.Number(),
              percentage: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      startDate?: string; 
      endDate?: string; 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { startDate, endDate } = request.query;

      logger.info('Fetching reconciliation statistics', { startDate, endDate });

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const filters: any = {};
      if (startDate || endDate) filters.createdAt = dateFilter;

      // Get disbursement statistics
      const [
        totalDisbursements,
        reconciledDisbursements,
        pendingReviews,
        reconciliationLogs,
      ] = await Promise.all([
        db.disbursement.findMany({
          where: filters,
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            reconciliationType: true,
            reconciliationConfidence: true,
          },
        }),
        db.disbursement.findMany({
          where: {
            ...filters,
            status: 'RECONCILED',
          },
          select: {
            id: true,
            amount: true,
            method: true,
            reconciliationType: true,
            reconciliationConfidence: true,
          },
        }),
        db.reconciliationReview.count({
          where: { status: 'PENDING_REVIEW' },
        }),
        db.reconciliationLog.findMany({
          where: filters,
          select: {
            matchConfidence: true,
            autoReconciled: true,
          },
        }),
      ]);

      const totalAmount = totalDisbursements.reduce((sum, d) => sum + d.amount, BigInt(0));
      const reconciledAmount = reconciledDisbursements.reduce((sum, d) => sum + d.amount, BigInt(0));

      const autoReconciledCount = reconciledDisbursements.filter(d => d.reconciliationType === 'AUTO').length;
      const manualReconciledCount = reconciledDisbursements.filter(d => d.reconciliationType === 'MANUAL').length;

      const averageMatchConfidence = reconciliationLogs.length > 0 
        ? reconciliationLogs.reduce((sum, log) => sum + log.matchConfidence, 0) / reconciliationLogs.length
        : 0;

      // Calculate method-specific statistics
      const methodStats = {
        ACH: { total: 0, reconciled: 0, percentage: 0 },
        USDC: { total: 0, reconciled: 0, percentage: 0 },
        SAFE_MULTISIG: { total: 0, reconciled: 0, percentage: 0 },
      };

      for (const disbursement of totalDisbursements) {
        if (methodStats[disbursement.method]) {
          methodStats[disbursement.method].total++;
          if (disbursement.status === 'RECONCILED') {
            methodStats[disbursement.method].reconciled++;
          }
        }
      }

      // Calculate percentages
      for (const method of Object.keys(methodStats)) {
        const stats = methodStats[method];
        stats.percentage = stats.total > 0 ? (stats.reconciled / stats.total) * 100 : 0;
      }

      const reconciledPercentage = totalDisbursements.length > 0 
        ? (reconciledDisbursements.length / totalDisbursements.length) * 100 
        : 0;

      reply.send({
        totalDisbursements: totalDisbursements.length,
        reconciledCount: reconciledDisbursements.length,
        reconciledPercentage,
        autoReconciledCount,
        manualReconciledCount,
        pendingReviewCount: pendingReviews,
        unreconciledCount: totalDisbursements.length - reconciledDisbursements.length,
        totalAmount: totalAmount.toString(),
        reconciledAmount: reconciledAmount.toString(),
        averageMatchConfidence,
        reconciliationMethods: methodStats,
      });
    } catch (error) {
      logger.error('Failed to fetch reconciliation statistics', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch reconciliation statistics',
      });
    }
  });

  /**
   * Get reconciliation logs
   */
  fastify.get('/logs', {
    schema: {
      tags: ['Reconciliation'],
      summary: 'Get reconciliation logs',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        disbursementId: Type.Optional(Type.Number()),
        autoReconciled: Type.Optional(Type.Boolean()),
        startDate: Type.Optional(Type.String({ format: 'date' })),
        endDate: Type.Optional(Type.String({ format: 'date' })),
      }),
      response: {
        200: Type.Object({
          logs: Type.Array(Type.Object({
            id: Type.Number(),
            disbursementId: Type.Number(),
            matchType: Type.String(),
            matchConfidence: Type.Number(),
            externalReference: Type.String(),
            matchedAmount: Type.Number(),
            amountDifference: Type.Number(),
            autoReconciled: Type.Boolean(),
            approvedBy: Type.Union([Type.String(), Type.Null()]),
            processedAt: Type.String(),
            disbursement: Type.Object({
              id: Type.Number(),
              amount: Type.String(),
              method: Type.String(),
              reference: Type.Union([Type.String(), Type.Null()]),
              invoice: Type.Object({
                invoiceNumber: Type.String(),
                contract: Type.Object({
                  vendor: Type.Object({
                    name: Type.String(),
                  }),
                }),
              }),
            }),
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
      disbursementId?: number;
      autoReconciled?: boolean;
      startDate?: string;
      endDate?: string;
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, disbursementId, autoReconciled, startDate, endDate } = request.query;

      logger.info('Fetching reconciliation logs', { page, limit, disbursementId, autoReconciled, startDate, endDate });

      const filters: any = {};
      if (disbursementId) filters.disbursementId = disbursementId;
      if (autoReconciled !== undefined) filters.autoReconciled = autoReconciled;
      
      if (startDate || endDate) {
        filters.processedAt = {};
        if (startDate) filters.processedAt.gte = new Date(startDate);
        if (endDate) filters.processedAt.lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        db.reconciliationLog.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { processedAt: 'desc' },
          include: {
            disbursement: {
              include: {
                invoice: {
                  include: {
                    contract: {
                      include: {
                        vendor: {
                          select: { name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        db.reconciliationLog.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / limit);

      reply.send({
        logs: logs.map(log => ({
          id: log.id,
          disbursementId: log.disbursementId,
          matchType: log.matchType,
          matchConfidence: log.matchConfidence,
          externalReference: log.externalReference,
          matchedAmount: log.matchedAmount,
          amountDifference: log.amountDifference,
          autoReconciled: log.autoReconciled,
          approvedBy: log.approvedBy,
          processedAt: log.processedAt.toISOString(),
          disbursement: {
            id: log.disbursement.id,
            amount: log.disbursement.amount.toString(),
            method: log.disbursement.method,
            reference: log.disbursement.reference,
            invoice: {
              invoiceNumber: log.disbursement.invoice.invoiceNumber,
              contract: {
                vendor: {
                  name: log.disbursement.invoice.contract.vendor.name,
                },
              },
            },
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch reconciliation logs', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch reconciliation logs',
      });
    }
  });
}