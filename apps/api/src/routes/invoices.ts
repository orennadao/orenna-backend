import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { InvoiceService } from '../lib/invoice';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
import { logger } from '../utils/logger';

// Request/Response schemas
const InvoiceCreateSchema = Type.Object({
  contractId: Type.Number(),
  vendorId: Type.Number(),
  invoiceNumber: Type.String({ minLength: 1, maxLength: 100 }),
  invoiceType: Type.Optional(Type.Union([
    Type.Literal('PROGRESS'),
    Type.Literal('COMPLETION'),
    Type.Literal('FINAL'),
    Type.Literal('CHANGE_ORDER'),
  ], { default: 'PROGRESS' })),
  periodStart: Type.Optional(Type.String({ format: 'date' })),
  periodEnd: Type.Optional(Type.String({ format: 'date' })),
  billingDate: Type.Optional(Type.String({ format: 'date' })),
  dueDate: Type.Optional(Type.String({ format: 'date' })),
  subtotalCents: Type.String(), // BigInt as string
  taxesCents: Type.Optional(Type.String()), // BigInt as string
  witholdingsCents: Type.Optional(Type.String()), // BigInt as string
  percentComplete: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  cumulativeAmount: Type.Optional(Type.String()), // BigInt as string
  previousAmountPaid: Type.Optional(Type.String()), // BigInt as string
  attachments: Type.Optional(Type.Any()),
});

const InvoiceCodingSchema = Type.Object({
  budgetLineId: Type.Number(),
  amountCents: Type.String(), // BigInt as string
  percentage: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  description: Type.Optional(Type.String({ maxLength: 255 })),
  accountCode: Type.Optional(Type.String({ maxLength: 50 })),
  costCenter: Type.Optional(Type.String({ maxLength: 50 })),
});

const ApprovalDataSchema = Type.Object({
  approverRole: Type.Union([
    Type.Literal('PROJECT_MANAGER'),
    Type.Literal('FINANCE_MANAGER'),
    Type.Literal('EXECUTIVE'),
    Type.Literal('OWNER'),
  ]),
  decision: Type.Union([
    Type.Literal('APPROVED'),
    Type.Literal('REJECTED'),
    Type.Literal('CONDITIONAL'),
  ]),
  approvalAmount: Type.Optional(Type.String()), // BigInt as string
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
  conditions: Type.Optional(Type.String({ maxLength: 1000 })),
});

const RejectionDataSchema = Type.Object({
  reason: Type.String({ minLength: 1, maxLength: 1000 }),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

const SchedulePaymentSchema = Type.Object({
  paymentDate: Type.String({ format: 'date' }),
});

// Response schemas
const InvoiceResponseSchema = Type.Object({
  id: Type.Number(),
  contractId: Type.Number(),
  vendorId: Type.Number(),
  invoiceNumber: Type.String(),
  invoiceType: Type.String(),
  periodStart: Type.Union([Type.String(), Type.Null()]),
  periodEnd: Type.Union([Type.String(), Type.Null()]),
  billingDate: Type.String(),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  subtotalCents: Type.String(),
  taxesCents: Type.String(),
  retentionCents: Type.String(),
  witholdingsCents: Type.String(),
  totalCents: Type.String(),
  netPayableCents: Type.String(),
  percentComplete: Type.Union([Type.Number(), Type.Null()]),
  cumulativeAmount: Type.Union([Type.String(), Type.Null()]),
  previousAmountPaid: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  approvalStatus: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  submittedBy: Type.String(),
  contract: Type.Object({
    id: Type.Number(),
    contractNumber: Type.String(),
    title: Type.String(),
  }),
  vendor: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    status: Type.String(),
  }),
});

const ValidationResultSchema = Type.Object({
  valid: Type.Boolean(),
  errors: Type.Array(Type.String()),
  warnings: Type.Array(Type.String()),
});

const ApprovalRoutingSchema = Type.Object({
  invoiceId: Type.Number(),
  approvalTier: Type.Number(),
  requiredRoles: Type.Array(Type.String()),
  requiredApprovers: Type.Number(),
  currentApprovals: Type.Number(),
  nextApprovers: Type.Array(Type.String()),
  estimatedApprovalDate: Type.String(),
});

const FundsCheckSchema = Type.Object({
  invoiceId: Type.Number(),
  contractId: Type.Number(),
  requestedAmount: Type.String(),
  availableFunds: Type.String(),
  encumberedFunds: Type.String(),
  sufficientFunds: Type.Boolean(),
  bucketBalances: Type.Array(Type.Object({
    bucketId: Type.Number(),
    bucketName: Type.String(),
    availableAmount: Type.String(),
    allocatedToContract: Type.String(),
  })),
});

const RetentionCalculationSchema = Type.Object({
  invoiceId: Type.Number(),
  subtotalAmount: Type.String(),
  retentionPercent: Type.Number(),
  retentionAmount: Type.String(),
  netPayableAmount: Type.String(),
});

const ContractValidationSchema = Type.Object({
  invoiceId: Type.Number(),
  contractId: Type.Number(),
  valid: Type.Boolean(),
  contractAmount: Type.String(),
  invoicedToDate: Type.String(),
  thisInvoiceAmount: Type.String(),
  remainingContract: Type.String(),
  percentComplete: Type.Number(),
  withinContractLimits: Type.Boolean(),
  errors: Type.Array(Type.String()),
  warnings: Type.Array(Type.String()),
});

const PaymentAuthSchema = Type.Object({
  invoiceId: Type.Number(),
  authorizedAmount: Type.String(),
  paymentMethod: Type.String(),
  scheduledDate: Type.String(),
  authorizationNumber: Type.String(),
  approvals: Type.Array(Type.Object({
    role: Type.String(),
    approver: Type.String(),
    approvedAt: Type.String(),
  })),
});

export async function invoiceRoutes(fastify: FastifyInstance) {
  const invoiceService = new InvoiceService(prisma);

  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * Create a new invoice
   */
  fastify.post('/', {
    schema: {
      tags: ['Invoices'],
      summary: 'Create a new invoice',
      body: InvoiceCreateSchema,
      response: {
        201: InvoiceResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof InvoiceCreateSchema.static }>, reply: FastifyReply) => {
    try {
      const invoiceData = {
        ...request.body,
        subtotalCents: BigInt(request.body.subtotalCents),
        taxesCents: request.body.taxesCents ? BigInt(request.body.taxesCents) : undefined,
        witholdingsCents: request.body.witholdingsCents ? BigInt(request.body.witholdingsCents) : undefined,
        cumulativeAmount: request.body.cumulativeAmount ? BigInt(request.body.cumulativeAmount) : undefined,
        previousAmountPaid: request.body.previousAmountPaid ? BigInt(request.body.previousAmountPaid) : undefined,
        periodStart: request.body.periodStart ? new Date(request.body.periodStart) : undefined,
        periodEnd: request.body.periodEnd ? new Date(request.body.periodEnd) : undefined,
        billingDate: request.body.billingDate ? new Date(request.body.billingDate) : undefined,
        dueDate: request.body.dueDate ? new Date(request.body.dueDate) : undefined,
        submittedBy: request.user.id,
      };

      logger.info('Creating invoice', { 
        invoiceNumber: invoiceData.invoiceNumber,
        contractId: invoiceData.contractId,
        vendorId: invoiceData.vendorId,
        submittedBy: invoiceData.submittedBy,
      });

      const invoice = await invoiceService.createInvoice(invoiceData);

      // Fetch invoice with relations
      const invoiceWithRelations = await db.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          contract: {
            select: { id: true, contractNumber: true, title: true },
          },
          vendor: {
            select: { id: true, name: true, status: true },
          },
        },
      });

      reply.code(201).send({
        id: invoiceWithRelations!.id,
        contractId: invoiceWithRelations!.contractId,
        vendorId: invoiceWithRelations!.vendorId,
        invoiceNumber: invoiceWithRelations!.invoiceNumber,
        invoiceType: invoiceWithRelations!.invoiceType,
        periodStart: invoiceWithRelations!.periodStart?.toISOString() || null,
        periodEnd: invoiceWithRelations!.periodEnd?.toISOString() || null,
        billingDate: invoiceWithRelations!.billingDate.toISOString(),
        dueDate: invoiceWithRelations!.dueDate?.toISOString() || null,
        subtotalCents: invoiceWithRelations!.subtotalCents.toString(),
        taxesCents: invoiceWithRelations!.taxesCents.toString(),
        retentionCents: invoiceWithRelations!.retentionCents.toString(),
        witholdingsCents: invoiceWithRelations!.witholdingsCents.toString(),
        totalCents: invoiceWithRelations!.totalCents.toString(),
        netPayableCents: invoiceWithRelations!.netPayableCents.toString(),
        percentComplete: invoiceWithRelations!.percentComplete,
        cumulativeAmount: invoiceWithRelations!.cumulativeAmount?.toString() || null,
        previousAmountPaid: invoiceWithRelations!.previousAmountPaid?.toString() || null,
        status: invoiceWithRelations!.status,
        approvalStatus: invoiceWithRelations!.approvalStatus,
        createdAt: invoiceWithRelations!.createdAt.toISOString(),
        updatedAt: invoiceWithRelations!.updatedAt.toISOString(),
        submittedBy: invoiceWithRelations!.submittedBy,
        contract: {
          id: invoiceWithRelations!.contract.id,
          contractNumber: invoiceWithRelations!.contract.contractNumber,
          title: invoiceWithRelations!.contract.title,
        },
        vendor: {
          id: invoiceWithRelations!.vendor.id,
          name: invoiceWithRelations!.vendor.name,
          status: invoiceWithRelations!.vendor.status,
        },
      });
    } catch (error) {
      logger.error('Failed to create invoice', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Get all invoices with filtering and pagination
   */
  fastify.get('/', {
    schema: {
      tags: ['Invoices'],
      summary: 'Get all invoices',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        contractId: Type.Optional(Type.Number()),
        vendorId: Type.Optional(Type.Number()),
        status: Type.Optional(Type.String()),
        approvalStatus: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          invoices: Type.Array(InvoiceResponseSchema),
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
      contractId?: number;
      vendorId?: number;
      status?: string;
      approvalStatus?: string;
      search?: string; 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, contractId, vendorId, status, approvalStatus, search } = request.query;

      logger.info('Fetching invoices', { page, limit, contractId, vendorId, status, approvalStatus, search });

      const filters: any = {};
      if (contractId) filters.contractId = contractId;
      if (vendorId) filters.vendorId = vendorId;
      if (status) filters.status = status;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
      if (search) {
        filters.OR = [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { contract: { contractNumber: { contains: search, mode: 'insensitive' } } },
          { vendor: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [invoices, total] = await Promise.all([
        db.invoice.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            contract: {
              select: { id: true, contractNumber: true, title: true },
            },
            vendor: {
              select: { id: true, name: true, status: true },
            },
          },
        }),
        db.invoice.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / limit);

      reply.send({
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          contractId: invoice.contractId,
          vendorId: invoice.vendorId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          periodStart: invoice.periodStart?.toISOString() || null,
          periodEnd: invoice.periodEnd?.toISOString() || null,
          billingDate: invoice.billingDate.toISOString(),
          dueDate: invoice.dueDate?.toISOString() || null,
          subtotalCents: invoice.subtotalCents.toString(),
          taxesCents: invoice.taxesCents.toString(),
          retentionCents: invoice.retentionCents.toString(),
          witholdingsCents: invoice.witholdingsCents.toString(),
          totalCents: invoice.totalCents.toString(),
          netPayableCents: invoice.netPayableCents.toString(),
          percentComplete: invoice.percentComplete,
          cumulativeAmount: invoice.cumulativeAmount?.toString() || null,
          previousAmountPaid: invoice.previousAmountPaid?.toString() || null,
          status: invoice.status,
          approvalStatus: invoice.approvalStatus,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
          submittedBy: invoice.submittedBy,
          contract: {
            id: invoice.contract.id,
            contractNumber: invoice.contract.contractNumber,
            title: invoice.contract.title,
          },
          vendor: {
            id: invoice.vendor.id,
            name: invoice.vendor.name,
            status: invoice.vendor.status,
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
      logger.error('Failed to fetch invoices', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch invoices',
      });
    }
  });

  /**
   * Get invoice by ID
   */
  fastify.get('/:id', {
    schema: {
      tags: ['Invoices'],
      summary: 'Get invoice by ID',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: InvoiceResponseSchema,
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

      logger.info('Fetching invoice', { invoiceId: id });

      const invoice = await db.invoice.findUnique({
        where: { id },
        include: {
          contract: {
            select: { id: true, contractNumber: true, title: true },
          },
          vendor: {
            select: { id: true, name: true, status: true },
          },
        },
      });

      if (!invoice) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Invoice ${id} not found`,
        });
        return;
      }

      reply.send({
        id: invoice.id,
        contractId: invoice.contractId,
        vendorId: invoice.vendorId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        periodStart: invoice.periodStart?.toISOString() || null,
        periodEnd: invoice.periodEnd?.toISOString() || null,
        billingDate: invoice.billingDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString() || null,
        subtotalCents: invoice.subtotalCents.toString(),
        taxesCents: invoice.taxesCents.toString(),
        retentionCents: invoice.retentionCents.toString(),
        witholdingsCents: invoice.witholdingsCents.toString(),
        totalCents: invoice.totalCents.toString(),
        netPayableCents: invoice.netPayableCents.toString(),
        percentComplete: invoice.percentComplete,
        cumulativeAmount: invoice.cumulativeAmount?.toString() || null,
        previousAmountPaid: invoice.previousAmountPaid?.toString() || null,
        status: invoice.status,
        approvalStatus: invoice.approvalStatus,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        submittedBy: invoice.submittedBy,
        contract: {
          id: invoice.contract.id,
          contractNumber: invoice.contract.contractNumber,
          title: invoice.contract.title,
        },
        vendor: {
          id: invoice.vendor.id,
          name: invoice.vendor.name,
          status: invoice.vendor.status,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch invoice', { error: error.message, invoiceId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch invoice',
      });
    }
  });

  /**
   * Submit invoice for approval
   */
  fastify.post('/:id/submit', {
    schema: {
      tags: ['Invoices'],
      summary: 'Submit invoice for approval',
      params: Type.Object({
        id: Type.Number(),
      }),
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
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Submitting invoice for approval', { invoiceId: id, submittedBy: request.user.id });

      await invoiceService.submitInvoice(id);

      reply.send({
        message: 'Invoice submitted for approval successfully',
        status: 'SUBMITTED',
      });
    } catch (error) {
      logger.error('Failed to submit invoice for approval', { error: error.message, invoiceId: request.params.id });
      
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
   * Validate invoice
   */
  fastify.get('/:id/validate', {
    schema: {
      tags: ['Invoices'],
      summary: 'Validate invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: ValidationResultSchema,
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

      logger.info('Validating invoice', { invoiceId: id });

      const validation = await invoiceService.validateInvoice(id);

      reply.send(validation);
    } catch (error) {
      logger.error('Failed to validate invoice', { error: error.message, invoiceId: request.params.id });
      
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
          message: 'Failed to validate invoice',
        });
      }
    }
  });

  /**
   * Code invoice to WBS
   */
  fastify.post('/:id/coding', {
    schema: {
      tags: ['Invoices'],
      summary: 'Code invoice to WBS',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Array(InvoiceCodingSchema),
      response: {
        200: Type.Object({
          message: Type.String(),
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
    Body: typeof InvoiceCodingSchema.static[]
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const coding = request.body.map(code => ({
        ...code,
        amountCents: BigInt(code.amountCents),
      }));

      logger.info('Coding invoice to WBS', { 
        invoiceId: id, 
        codingCount: coding.length,
        totalAmount: coding.reduce((sum, c) => sum + c.amountCents, BigInt(0)).toString(),
      });

      await invoiceService.codeInvoiceToWBS(id, coding);

      reply.send({
        message: 'Invoice coded to WBS successfully',
      });
    } catch (error) {
      logger.error('Failed to code invoice to WBS', { error: error.message, invoiceId: request.params.id });
      
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
   * Route invoice for approval
   */
  fastify.get('/:id/approval-routing', {
    schema: {
      tags: ['Invoices'],
      summary: 'Get invoice approval routing',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: ApprovalRoutingSchema,
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

      logger.info('Getting invoice approval routing', { invoiceId: id });

      const routing = await invoiceService.routeForApproval(id);

      reply.send({
        invoiceId: routing.invoiceId,
        approvalTier: routing.approvalTier,
        requiredRoles: routing.requiredRoles,
        requiredApprovers: routing.requiredApprovers,
        currentApprovals: routing.currentApprovals,
        nextApprovers: routing.nextApprovers,
        estimatedApprovalDate: routing.estimatedApprovalDate.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get invoice approval routing', { error: error.message, invoiceId: request.params.id });
      
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
          message: 'Failed to get invoice approval routing',
        });
      }
    }
  });

  /**
   * Approve invoice
   */
  fastify.post('/:id/approve', {
    schema: {
      tags: ['Invoices'],
      summary: 'Approve invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: ApprovalDataSchema,
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
    Body: typeof ApprovalDataSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const approval = {
        ...request.body,
        approverAddress: request.user.id,
        approvalAmount: request.body.approvalAmount ? BigInt(request.body.approvalAmount) : undefined,
      };

      logger.info('Approving invoice', { 
        invoiceId: id, 
        approverAddress: approval.approverAddress,
        approverRole: approval.approverRole,
        decision: approval.decision,
      });

      await invoiceService.approveInvoice(id, approval);

      reply.send({
        message: 'Invoice approved successfully',
        status: 'APPROVED',
      });
    } catch (error) {
      logger.error('Failed to approve invoice', { error: error.message, invoiceId: request.params.id });
      
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
   * Reject invoice
   */
  fastify.post('/:id/reject', {
    schema: {
      tags: ['Invoices'],
      summary: 'Reject invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: RejectionDataSchema,
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
    Body: typeof RejectionDataSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const rejection = {
        ...request.body,
        rejectedBy: request.user.id,
      };

      logger.info('Rejecting invoice', { 
        invoiceId: id, 
        rejectedBy: rejection.rejectedBy,
        reason: rejection.reason,
      });

      await invoiceService.rejectInvoice(id, rejection);

      reply.send({
        message: 'Invoice rejected successfully',
        status: 'REJECTED',
      });
    } catch (error) {
      logger.error('Failed to reject invoice', { error: error.message, invoiceId: request.params.id });
      
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
   * Schedule invoice for payment
   */
  fastify.post('/:id/schedule', {
    schema: {
      tags: ['Invoices'],
      summary: 'Schedule invoice for payment',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: SchedulePaymentSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          status: Type.String(),
          scheduledDate: Type.String(),
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
    Body: typeof SchedulePaymentSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const paymentDate = new Date(request.body.paymentDate);

      logger.info('Scheduling invoice for payment', { 
        invoiceId: id, 
        paymentDate: paymentDate.toISOString(),
        scheduledBy: request.user.id,
      });

      await invoiceService.scheduleForPayment(id, paymentDate);

      reply.send({
        message: 'Invoice scheduled for payment successfully',
        status: 'SCHEDULED',
        scheduledDate: paymentDate.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to schedule invoice for payment', { error: error.message, invoiceId: request.params.id });
      
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
   * Check funds availability
   */
  fastify.get('/:id/funds-check', {
    schema: {
      tags: ['Invoices'],
      summary: 'Check funds availability for invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: FundsCheckSchema,
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

      logger.info('Checking funds availability for invoice', { invoiceId: id });

      const fundsCheck = await invoiceService.checkFundsAvailability(id);

      reply.send({
        invoiceId: fundsCheck.invoiceId,
        contractId: fundsCheck.contractId,
        requestedAmount: fundsCheck.requestedAmount.toString(),
        availableFunds: fundsCheck.availableFunds.toString(),
        encumberedFunds: fundsCheck.encumberedFunds.toString(),
        sufficientFunds: fundsCheck.sufficientFunds,
        bucketBalances: fundsCheck.bucketBalances.map(bucket => ({
          bucketId: bucket.bucketId,
          bucketName: bucket.bucketName,
          availableAmount: bucket.availableAmount.toString(),
          allocatedToContract: bucket.allocatedToContract.toString(),
        })),
      });
    } catch (error) {
      logger.error('Failed to check funds availability', { error: error.message, invoiceId: request.params.id });
      
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
          message: 'Failed to check funds availability',
        });
      }
    }
  });

  /**
   * Calculate retention
   */
  fastify.get('/:id/retention', {
    schema: {
      tags: ['Invoices'],
      summary: 'Calculate retention for invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: RetentionCalculationSchema,
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

      logger.info('Calculating retention for invoice', { invoiceId: id });

      const retention = await invoiceService.calculateRetention(id);

      reply.send({
        invoiceId: retention.invoiceId,
        subtotalAmount: retention.subtotalAmount.toString(),
        retentionPercent: retention.retentionPercent,
        retentionAmount: retention.retentionAmount.toString(),
        netPayableAmount: retention.netPayableAmount.toString(),
      });
    } catch (error) {
      logger.error('Failed to calculate retention', { error: error.message, invoiceId: request.params.id });
      
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
          message: 'Failed to calculate retention',
        });
      }
    }
  });

  /**
   * Validate against contract
   */
  fastify.get('/:id/contract-validation', {
    schema: {
      tags: ['Invoices'],
      summary: 'Validate invoice against contract',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: ContractValidationSchema,
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

      logger.info('Validating invoice against contract', { invoiceId: id });

      const validation = await invoiceService.validateAgainstContract(id);

      reply.send({
        invoiceId: validation.invoiceId,
        contractId: validation.contractId,
        valid: validation.valid,
        contractAmount: validation.contractAmount.toString(),
        invoicedToDate: validation.invoicedToDate.toString(),
        thisInvoiceAmount: validation.thisInvoiceAmount.toString(),
        remainingContract: validation.remainingContract.toString(),
        percentComplete: validation.percentComplete,
        withinContractLimits: validation.withinContractLimits,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    } catch (error) {
      logger.error('Failed to validate invoice against contract', { error: error.message, invoiceId: request.params.id });
      
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
          message: 'Failed to validate invoice against contract',
        });
      }
    }
  });

  /**
   * Generate payment authorization
   */
  fastify.post('/:id/payment-authorization', {
    schema: {
      tags: ['Invoices'],
      summary: 'Generate payment authorization for invoice',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: PaymentAuthSchema,
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
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      logger.info('Generating payment authorization for invoice', { invoiceId: id, authorizedBy: request.user.id });

      const paymentAuth = await invoiceService.generatePaymentAuthorization(id);

      reply.send({
        invoiceId: paymentAuth.invoiceId,
        authorizedAmount: paymentAuth.authorizedAmount.toString(),
        paymentMethod: paymentAuth.paymentMethod,
        scheduledDate: paymentAuth.scheduledDate.toISOString(),
        authorizationNumber: paymentAuth.authorizationNumber,
        approvals: paymentAuth.approvals.map(approval => ({
          role: approval.role,
          approver: approval.approver,
          approvedAt: approval.approvedAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.error('Failed to generate payment authorization', { error: error.message, invoiceId: request.params.id });
      
      if (error.message.includes('not found')) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message,
        });
      } else if (error.message.includes('not approved')) {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      } else {
        reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to generate payment authorization',
        });
      }
    }
  });
}