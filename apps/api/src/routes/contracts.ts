import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { ContractService } from '../lib/contract';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
import { logger } from '../utils/logger';

// Request/Response schemas
const ContractCreateSchema = Type.Object({
  projectId: Type.Number(),
  vendorId: Type.Number(),
  contractNumber: Type.String({ minLength: 1, maxLength: 100 }),
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  amount: Type.String(), // BigInt as string
  currency: Type.Union([Type.Literal('USD'), Type.Literal('EUR'), Type.Literal('GBP')], { default: 'USD' }),
  startDate: Type.String({ format: 'date' }),
  endDate: Type.String({ format: 'date' }),
  retentionPercentage: Type.Optional(Type.Number({ minimum: 0, maximum: 100, default: 0 })),
  terms: Type.Optional(Type.String({ maxLength: 5000 })),
  workScope: Type.Optional(Type.String({ maxLength: 5000 })),
  deliverables: Type.Optional(Type.Array(Type.String())),
  milestones: Type.Optional(Type.Array(Type.Object({
    name: Type.String({ maxLength: 255 }),
    description: Type.Optional(Type.String({ maxLength: 1000 })),
    dueDate: Type.String({ format: 'date' }),
    amount: Type.String(), // BigInt as string
    dependencies: Type.Optional(Type.Array(Type.String())),
  }))),
});

const BudgetAllocationSchema = Type.Object({
  fundingBucketId: Type.Number(),
  amount: Type.String(), // BigInt as string
  wbsCode: Type.String({ minLength: 1, maxLength: 50 }),
  description: Type.String({ minLength: 1, maxLength: 255 }),
  category: Type.Optional(Type.String({ maxLength: 100 })),
});

const ChangeOrderCreateSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.String({ minLength: 1, maxLength: 2000 }),
  amountChange: Type.String(), // BigInt as string (can be negative)
  timeChange: Type.Number(), // days (can be negative)
  justification: Type.String({ minLength: 1, maxLength: 2000 }),
  category: Type.Optional(Type.Union([
    Type.Literal('SCOPE_CHANGE'),
    Type.Literal('DESIGN_CHANGE'),
    Type.Literal('FIELD_CONDITION'),
    Type.Literal('OWNER_REQUEST'),
    Type.Literal('REGULATORY'),
    Type.Literal('EMERGENCY'),
    Type.Literal('OTHER'),
  ])),
  urgency: Type.Optional(Type.Union([
    Type.Literal('LOW'),
    Type.Literal('MEDIUM'),
    Type.Literal('HIGH'),
    Type.Literal('CRITICAL'),
  ])),
  attachments: Type.Optional(Type.Array(Type.Object({
    fileName: Type.String(),
    originalFileName: Type.String(),
    fileHash: Type.String(),
    fileSize: Type.Number(),
    mimeType: Type.Optional(Type.String()),
  }))),
});

const ApprovalDataSchema = Type.Object({
  approverRole: Type.Union([
    Type.Literal('PROJECT_MANAGER'),
    Type.Literal('FINANCE_MANAGER'),
    Type.Literal('EXECUTIVE'),
    Type.Literal('OWNER'),
  ]),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

// Response schemas
const ContractResponseSchema = Type.Object({
  id: Type.Number(),
  projectId: Type.Number(),
  vendorId: Type.Number(),
  contractNumber: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  amount: Type.String(),
  currency: Type.String(),
  status: Type.String(),
  startDate: Type.String(),
  endDate: Type.String(),
  retentionPercentage: Type.Number(),
  currentAmount: Type.String(),
  paidAmount: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  project: Type.Object({
    id: Type.Number(),
    name: Type.String(),
  }),
  vendor: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    status: Type.String(),
  }),
});

const ChangeOrderResponseSchema = Type.Object({
  id: Type.Number(),
  contractId: Type.Number(),
  title: Type.String(),
  description: Type.String(),
  amountChange: Type.String(),
  timeChange: Type.Number(),
  status: Type.String(),
  justification: Type.String(),
  category: Type.Union([Type.String(), Type.Null()]),
  urgency: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  requestedBy: Type.String(),
});

const BudgetAllocationResponseSchema = Type.Object({
  id: Type.Number(),
  contractId: Type.Number(),
  fundingBucketId: Type.Number(),
  amount: Type.String(),
  wbsCode: Type.String(),
  description: Type.String(),
  category: Type.Union([Type.String(), Type.Null()]),
  allocatedAt: Type.String(),
  fundingBucket: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    balance: Type.String(),
  }),
});

const ChangeOrderImpactSchema = Type.Object({
  changeOrderId: Type.Number(),
  newContractAmount: Type.String(),
  totalAmountChange: Type.String(),
  totalTimeChange: Type.Number(),
  percentageIncrease: Type.Number(),
  newEndDate: Type.String(),
  budgetImpact: Type.Array(Type.Object({
    fundingBucketId: Type.Number(),
    bucketName: Type.String(),
    additionalRequired: Type.String(),
    available: Type.String(),
    sufficient: Type.Boolean(),
  })),
  milestoneImpact: Type.Array(Type.Object({
    milestoneName: Type.String(),
    originalDate: Type.String(),
    newDate: Type.String(),
    daysDifference: Type.Number(),
  })),
});

export async function contractRoutes(fastify: FastifyInstance) {
  const contractService = new ContractService(prisma);

  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * Create a new contract
   */
  fastify.post('/', {
    schema: {
      tags: ['Contracts'],
      summary: 'Create a new contract',
      body: ContractCreateSchema,
      response: {
        201: ContractResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof ContractCreateSchema.static }>, reply: FastifyReply) => {
    try {
      const contractData = {
        ...request.body,
        amount: BigInt(request.body.amount),
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
        milestones: request.body.milestones?.map(m => ({
          ...m,
          amount: BigInt(m.amount),
          dueDate: new Date(m.dueDate),
        })),
        createdBy: request.user.id,
      };

      logger.info('Creating contract', { 
        contractNumber: contractData.contractNumber,
        projectId: contractData.projectId,
        vendorId: contractData.vendorId,
        createdBy: contractData.createdBy,
      });

      const contract = await contractService.createContract(contractData);

      reply.code(201).send({
        id: contract.id,
        projectId: contract.projectId,
        vendorId: contract.vendorId,
        contractNumber: contract.contractNumber,
        title: contract.title,
        description: contract.description,
        amount: contract.amount.toString(),
        currency: contract.currency,
        status: contract.status,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        retentionPercentage: contract.retentionPercentage,
        currentAmount: contract.currentAmount?.toString() || contract.amount.toString(),
        paidAmount: contract.paidAmount?.toString() || '0',
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
        project: {
          id: contract.project.id,
          name: contract.project.name,
        },
        vendor: {
          id: contract.vendor.id,
          name: contract.vendor.name,
          status: contract.vendor.status,
        },
      });
    } catch (error) {
      logger.error('Failed to create contract', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * Get all contracts with filtering and pagination
   */
  fastify.get('/', {
    schema: {
      tags: ['Contracts'],
      summary: 'Get all contracts',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        projectId: Type.Optional(Type.Number()),
        vendorId: Type.Optional(Type.Number()),
        status: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          contracts: Type.Array(ContractResponseSchema),
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
      projectId?: number;
      vendorId?: number;
      status?: string; 
      search?: string; 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, projectId, vendorId, status, search } = request.query;

      logger.info('Fetching contracts', { page, limit, projectId, vendorId, status, search });

      const filters: any = {};
      if (projectId) filters.projectId = projectId;
      if (vendorId) filters.vendorId = vendorId;
      if (status) filters.status = status;
      if (search) {
        filters.OR = [
          { contractNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [contracts, total] = await Promise.all([
        db.financeContract.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { id: true, name: true },
            },
            vendor: {
              select: { id: true, name: true, status: true },
            },
          },
        }),
        db.financeContract.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / limit);

      reply.send({
        contracts: contracts.map(contract => ({
          id: contract.id,
          projectId: contract.projectId,
          vendorId: contract.vendorId,
          contractNumber: contract.contractNumber,
          title: contract.title,
          description: contract.description,
          amount: contract.amount.toString(),
          currency: contract.currency,
          status: contract.status,
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate.toISOString(),
          retentionPercentage: contract.retentionPercentage,
          currentAmount: contract.currentAmount?.toString() || contract.amount.toString(),
          paidAmount: contract.paidAmount?.toString() || '0',
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          project: {
            id: contract.project.id,
            name: contract.project.name,
          },
          vendor: {
            id: contract.vendor.id,
            name: contract.vendor.name,
            status: contract.vendor.status,
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
      logger.error('Failed to fetch contracts', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch contracts',
      });
    }
  });

  /**
   * Get contract by ID
   */
  fastify.get('/:id', {
    schema: {
      tags: ['Contracts'],
      summary: 'Get contract by ID',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: ContractResponseSchema,
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

      logger.info('Fetching contract', { contractId: id });

      const contract = await db.financeContract.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, name: true },
          },
          vendor: {
            select: { id: true, name: true, status: true },
          },
          budgetAllocations: {
            include: {
              fundingBucket: {
                select: { id: true, name: true, balance: true },
              },
            },
          },
          changeOrders: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!contract) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Contract ${id} not found`,
        });
        return;
      }

      reply.send({
        id: contract.id,
        projectId: contract.projectId,
        vendorId: contract.vendorId,
        contractNumber: contract.contractNumber,
        title: contract.title,
        description: contract.description,
        amount: contract.amount.toString(),
        currency: contract.currency,
        status: contract.status,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        retentionPercentage: contract.retentionPercentage,
        currentAmount: contract.currentAmount?.toString() || contract.amount.toString(),
        paidAmount: contract.paidAmount?.toString() || '0',
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
        project: {
          id: contract.project.id,
          name: contract.project.name,
        },
        vendor: {
          id: contract.vendor.id,
          name: contract.vendor.name,
          status: contract.vendor.status,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch contract', { error: error.message, contractId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch contract',
      });
    }
  });

  /**
   * Allocate budget to contract
   */
  fastify.post('/:id/budget-allocations', {
    schema: {
      tags: ['Contracts'],
      summary: 'Allocate budget to contract',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Array(BudgetAllocationSchema),
      response: {
        201: Type.Object({
          message: Type.String(),
          allocations: Type.Array(BudgetAllocationResponseSchema),
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
    Body: typeof BudgetAllocationSchema.static[]
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const allocations = request.body.map(allocation => ({
        ...allocation,
        amount: BigInt(allocation.amount),
      }));

      logger.info('Allocating budget to contract', { 
        contractId: id, 
        allocationCount: allocations.length,
        totalAmount: allocations.reduce((sum, a) => sum + a.amount, BigInt(0)).toString(),
      });

      await contractService.allocateBudget(id, allocations);

      // Fetch the created allocations
      const createdAllocations = await db.budgetAllocation.findMany({
        where: { contractId: id },
        include: {
          fundingBucket: {
            select: { id: true, name: true, balance: true },
          },
        },
        orderBy: { allocatedAt: 'desc' },
        take: allocations.length,
      });

      reply.code(201).send({
        message: 'Budget allocated successfully',
        allocations: createdAllocations.map(allocation => ({
          id: allocation.id,
          contractId: allocation.contractId,
          fundingBucketId: allocation.fundingBucketId,
          amount: allocation.amount.toString(),
          wbsCode: allocation.wbsCode,
          description: allocation.description,
          category: allocation.category,
          allocatedAt: allocation.allocatedAt.toISOString(),
          fundingBucket: {
            id: allocation.fundingBucket.id,
            name: allocation.fundingBucket.name,
            balance: allocation.fundingBucket.balance.toString(),
          },
        })),
      });
    } catch (error) {
      logger.error('Failed to allocate budget', { error: error.message, contractId: request.params.id });
      
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
   * Get contract budget allocations
   */
  fastify.get('/:id/budget-allocations', {
    schema: {
      tags: ['Contracts'],
      summary: 'Get contract budget allocations',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Array(BudgetAllocationResponseSchema),
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

      logger.info('Fetching contract budget allocations', { contractId: id });

      const contract = await db.financeContract.findUnique({
        where: { id },
      });

      if (!contract) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Contract ${id} not found`,
        });
        return;
      }

      const allocations = await db.budgetAllocation.findMany({
        where: { contractId: id },
        include: {
          fundingBucket: {
            select: { id: true, name: true, balance: true },
          },
        },
        orderBy: { allocatedAt: 'desc' },
      });

      reply.send(allocations.map(allocation => ({
        id: allocation.id,
        contractId: allocation.contractId,
        fundingBucketId: allocation.fundingBucketId,
        amount: allocation.amount.toString(),
        wbsCode: allocation.wbsCode,
        description: allocation.description,
        category: allocation.category,
        allocatedAt: allocation.allocatedAt.toISOString(),
        fundingBucket: {
          id: allocation.fundingBucket.id,
          name: allocation.fundingBucket.name,
          balance: allocation.fundingBucket.balance.toString(),
        },
      })));
    } catch (error) {
      logger.error('Failed to fetch budget allocations', { error: error.message, contractId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch budget allocations',
      });
    }
  });

  /**
   * Submit contract for approval
   */
  fastify.post('/:id/submit', {
    schema: {
      tags: ['Contracts'],
      summary: 'Submit contract for approval',
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

      logger.info('Submitting contract for approval', { contractId: id, submittedBy: request.user.id });

      await contractService.submitForApproval(id);

      reply.send({
        message: 'Contract submitted for approval successfully',
        status: 'PENDING_APPROVAL',
      });
    } catch (error) {
      logger.error('Failed to submit contract for approval', { error: error.message, contractId: request.params.id });
      
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
   * Approve contract
   */
  fastify.post('/:id/approve', {
    schema: {
      tags: ['Contracts'],
      summary: 'Approve contract',
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
      const approverData = {
        ...request.body,
        approverId: request.user.id,
      };

      logger.info('Approving contract', { 
        contractId: id, 
        approverId: approverData.approverId,
        approverRole: approverData.approverRole,
      });

      await contractService.approveContract(id, approverData);

      reply.send({
        message: 'Contract approved successfully',
        status: 'APPROVED',
      });
    } catch (error) {
      logger.error('Failed to approve contract', { error: error.message, contractId: request.params.id });
      
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
   * Execute contract
   */
  fastify.post('/:id/execute', {
    schema: {
      tags: ['Contracts'],
      summary: 'Execute contract',
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

      logger.info('Executing contract', { contractId: id, executedBy: request.user.id });

      await contractService.executeContract(id);

      reply.send({
        message: 'Contract executed successfully',
        status: 'ACTIVE',
      });
    } catch (error) {
      logger.error('Failed to execute contract', { error: error.message, contractId: request.params.id });
      
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
   * Create change order
   */
  fastify.post('/:id/change-orders', {
    schema: {
      tags: ['Contracts'],
      summary: 'Create change order',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: ChangeOrderCreateSchema,
      response: {
        201: ChangeOrderResponseSchema,
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
    Body: typeof ChangeOrderCreateSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const changeData = {
        ...request.body,
        amountChange: BigInt(request.body.amountChange),
        requestedBy: request.user.id,
      };

      logger.info('Creating change order', { 
        contractId: id, 
        title: changeData.title,
        amountChange: changeData.amountChange.toString(),
        requestedBy: changeData.requestedBy,
      });

      const changeOrder = await contractService.createChangeOrder(id, changeData);

      reply.code(201).send({
        id: changeOrder.id,
        contractId: changeOrder.contractId,
        title: changeOrder.title,
        description: changeOrder.description,
        amountChange: changeOrder.amountChange.toString(),
        timeChange: changeOrder.timeChange,
        status: changeOrder.status,
        justification: changeOrder.justification,
        category: changeOrder.category,
        urgency: changeOrder.urgency,
        createdAt: changeOrder.createdAt.toISOString(),
        updatedAt: changeOrder.updatedAt.toISOString(),
        requestedBy: changeOrder.requestedBy,
      });
    } catch (error) {
      logger.error('Failed to create change order', { error: error.message, contractId: request.params.id });
      
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
   * Get contract change orders
   */
  fastify.get('/:id/change-orders', {
    schema: {
      tags: ['Contracts'],
      summary: 'Get contract change orders',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Array(ChangeOrderResponseSchema),
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

      logger.info('Fetching contract change orders', { contractId: id });

      const contract = await db.financeContract.findUnique({
        where: { id },
      });

      if (!contract) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Contract ${id} not found`,
        });
        return;
      }

      const changeOrders = await db.changeOrder.findMany({
        where: { contractId: id },
        orderBy: { createdAt: 'desc' },
      });

      reply.send(changeOrders.map(changeOrder => ({
        id: changeOrder.id,
        contractId: changeOrder.contractId,
        title: changeOrder.title,
        description: changeOrder.description,
        amountChange: changeOrder.amountChange.toString(),
        timeChange: changeOrder.timeChange,
        status: changeOrder.status,
        justification: changeOrder.justification,
        category: changeOrder.category,
        urgency: changeOrder.urgency,
        createdAt: changeOrder.createdAt.toISOString(),
        updatedAt: changeOrder.updatedAt.toISOString(),
        requestedBy: changeOrder.requestedBy,
      })));
    } catch (error) {
      logger.error('Failed to fetch change orders', { error: error.message, contractId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch change orders',
      });
    }
  });

  /**
   * Calculate change order impact
   */
  fastify.get('/change-orders/:changeOrderId/impact', {
    schema: {
      tags: ['Contracts'],
      summary: 'Calculate change order impact',
      params: Type.Object({
        changeOrderId: Type.Number(),
      }),
      response: {
        200: ChangeOrderImpactSchema,
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { changeOrderId: number } }>, reply: FastifyReply) => {
    try {
      const { changeOrderId } = request.params;

      logger.info('Calculating change order impact', { changeOrderId });

      const impact = await contractService.calculateImpact(changeOrderId);

      reply.send({
        changeOrderId: impact.changeOrderId,
        newContractAmount: impact.newContractAmount.toString(),
        totalAmountChange: impact.totalAmountChange.toString(),
        totalTimeChange: impact.totalTimeChange,
        percentageIncrease: impact.percentageIncrease,
        newEndDate: impact.newEndDate.toISOString(),
        budgetImpact: impact.budgetImpact.map(budget => ({
          fundingBucketId: budget.fundingBucketId,
          bucketName: budget.bucketName,
          additionalRequired: budget.additionalRequired.toString(),
          available: budget.available.toString(),
          sufficient: budget.sufficient,
        })),
        milestoneImpact: impact.milestoneImpact.map(milestone => ({
          milestoneName: milestone.milestoneName,
          originalDate: milestone.originalDate.toISOString(),
          newDate: milestone.newDate.toISOString(),
          daysDifference: milestone.daysDifference,
        })),
      });
    } catch (error) {
      logger.error('Failed to calculate change order impact', { 
        error: error.message, 
        changeOrderId: request.params.changeOrderId,
      });
      
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
          message: 'Failed to calculate change order impact',
        });
      }
    }
  });

  /**
   * Approve change order
   */
  fastify.post('/change-orders/:changeOrderId/approve', {
    schema: {
      tags: ['Contracts'],
      summary: 'Approve change order',
      params: Type.Object({
        changeOrderId: Type.Number(),
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
    Params: { changeOrderId: number }; 
    Body: typeof ApprovalDataSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { changeOrderId } = request.params;
      const approval = {
        ...request.body,
        approverId: request.user.id,
      };

      logger.info('Approving change order', { 
        changeOrderId, 
        approverId: approval.approverId,
        approverRole: approval.approverRole,
      });

      await contractService.approveChangeOrder(changeOrderId, approval);

      reply.send({
        message: 'Change order approved successfully',
        status: 'APPROVED',
      });
    } catch (error) {
      logger.error('Failed to approve change order', { 
        error: error.message, 
        changeOrderId: request.params.changeOrderId,
      });
      
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
   * Implement change order
   */
  fastify.post('/change-orders/:changeOrderId/implement', {
    schema: {
      tags: ['Contracts'],
      summary: 'Implement change order',
      params: Type.Object({
        changeOrderId: Type.Number(),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          status: Type.String(),
          newContractAmount: Type.String(),
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
  }, async (request: FastifyRequest<{ Params: { changeOrderId: number } }>, reply: FastifyReply) => {
    try {
      const { changeOrderId } = request.params;

      logger.info('Implementing change order', { changeOrderId, implementedBy: request.user.id });

      const result = await contractService.implementChangeOrder(changeOrderId);

      reply.send({
        message: 'Change order implemented successfully',
        status: 'IMPLEMENTED',
        newContractAmount: result.newContractAmount.toString(),
      });
    } catch (error) {
      logger.error('Failed to implement change order', { 
        error: error.message, 
        changeOrderId: request.params.changeOrderId,
      });
      
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
}