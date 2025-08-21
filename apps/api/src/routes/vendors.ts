import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { VendorService } from '../lib/vendor';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
import { logger } from '../utils/logger';

// Request/Response schemas
const VendorCreateSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  legalName: Type.Optional(Type.String({ maxLength: 255 })),
  email: Type.Optional(Type.String({ format: 'email' })),
  phone: Type.Optional(Type.String({ maxLength: 50 })),
  website: Type.Optional(Type.String({ format: 'uri' })),
  address: Type.Optional(Type.Object({
    street: Type.String({ maxLength: 255 }),
    city: Type.String({ maxLength: 100 }),
    state: Type.String({ maxLength: 100 }),
    zip: Type.String({ maxLength: 20 }),
    country: Type.String({ maxLength: 100 }),
  })),
  taxStatus: Type.Optional(Type.Union([
    Type.Literal('INDIVIDUAL'),
    Type.Literal('SOLE_PROPRIETOR'),
    Type.Literal('PARTNERSHIP'),
    Type.Literal('LLC'),
    Type.Literal('CORPORATION'),
    Type.Literal('NON_PROFIT'),
    Type.Literal('GOVERNMENT'),
    Type.Literal('FOREIGN'),
  ])),
  taxId: Type.Optional(Type.String({ maxLength: 50 })),
  paymentMethod: Type.Optional(Type.Union([
    Type.Literal('ACH'),
    Type.Literal('WIRE'),
    Type.Literal('CHECK'),
    Type.Literal('USDC'),
    Type.Literal('SAFE_MULTISIG'),
  ])),
  bankDetails: Type.Optional(Type.Object({
    routingNumber: Type.Optional(Type.String({ maxLength: 20 })),
    accountNumber: Type.Optional(Type.String({ maxLength: 50 })),
    accountType: Type.Optional(Type.Union([Type.Literal('CHECKING'), Type.Literal('SAVINGS')])),
    bankName: Type.Optional(Type.String({ maxLength: 255 })),
  })),
  cryptoAddress: Type.Optional(Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' })),
  safeAddress: Type.Optional(Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' })),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

const VendorUpdateSchema = Type.Partial(VendorCreateSchema);

const VendorDocumentUploadSchema = Type.Object({
  fileName: Type.String({ minLength: 1, maxLength: 255 }),
  originalFileName: Type.String({ minLength: 1, maxLength: 255 }),
  fileHash: Type.String({ minLength: 1, maxLength: 128 }),
  ipfsCid: Type.Optional(Type.String({ maxLength: 100 })),
  fileSize: Type.Number({ minimum: 1 }),
  mimeType: Type.Optional(Type.String({ maxLength: 100 })),
  documentType: Type.Union([
    Type.Literal('BUSINESS_LICENSE'),
    Type.Literal('TAX_FORM'),
    Type.Literal('INSURANCE_COI'),
    Type.Literal('BOND_CERTIFICATE'),
    Type.Literal('BANK_VERIFICATION'),
    Type.Literal('IDENTITY_DOCUMENT'),
    Type.Literal('CONTRACT'),
    Type.Literal('OTHER'),
  ]),
  issueDate: Type.Optional(Type.String({ format: 'date' })),
  expiryDate: Type.Optional(Type.String({ format: 'date' })),
  issuingAuthority: Type.Optional(Type.String({ maxLength: 255 })),
});

const KYCReviewSchema = Type.Object({
  approved: Type.Boolean(),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

const ComplianceUpdateSchema = Type.Object({
  sanctionsStatus: Type.Optional(Type.Union([
    Type.Literal('CLEAR'),
    Type.Literal('FLAGGED'),
    Type.Literal('PENDING'),
  ])),
  debarmentStatus: Type.Optional(Type.Union([
    Type.Literal('CLEAR'),
    Type.Literal('FLAGGED'),
    Type.Literal('PENDING'),
  ])),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
});

// Response schemas
const VendorResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  legalName: Type.Union([Type.String(), Type.Null()]),
  email: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  website: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  kycStatus: Type.String(),
  taxStatus: Type.Union([Type.String(), Type.Null()]),
  sanctionsStatus: Type.Union([Type.String(), Type.Null()]),
  debarmentStatus: Type.Union([Type.String(), Type.Null()]),
  paymentMethod: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const VendorListResponseSchema = Type.Object({
  vendors: Type.Array(VendorResponseSchema),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number(),
  }),
});

const DocumentResponseSchema = Type.Object({
  id: Type.Number(),
  fileName: Type.String(),
  originalFileName: Type.String(),
  documentType: Type.String(),
  fileSize: Type.String(),
  mimeType: Type.Union([Type.String(), Type.Null()]),
  issueDate: Type.Union([Type.String(), Type.Null()]),
  expiryDate: Type.Union([Type.String(), Type.Null()]),
  issuingAuthority: Type.Union([Type.String(), Type.Null()]),
  uploadedAt: Type.String(),
});

export async function vendorRoutes(fastify: FastifyInstance) {
  const vendorService = new VendorService(prisma);

  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * Create a new vendor
   */
  fastify.post('/', {
    schema: {
      tags: ['Vendors'],
      summary: 'Create a new vendor',
      body: VendorCreateSchema,
      response: {
        201: VendorResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
        409: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof VendorCreateSchema.static }>, reply: FastifyReply) => {
    try {
      const vendorData = {
        ...request.body,
        createdBy: request.user?.userId || 0,
      };

      logger.info('Creating vendor', { name: vendorData.name, createdBy: vendorData.createdBy });

      const vendor = await vendorService.createVendor(vendorData);

      reply.code(201).send({
        id: vendor.id,
        name: vendor.name,
        legalName: vendor.legalName,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        status: vendor.status,
        kycStatus: vendor.kycStatus,
        taxStatus: vendor.taxStatus,
        sanctionsStatus: vendor.sanctionsStatus,
        debarmentStatus: vendor.debarmentStatus,
        paymentMethod: vendor.paymentMethod,
        createdAt: vendor.createdAt.toISOString(),
        updatedAt: vendor.updatedAt.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to create vendor', { error: error.message });
      
      if (error.message.includes('already exists')) {
        reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
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
   * Get all vendors with pagination and filtering
   */
  fastify.get('/', {
    schema: {
      tags: ['Vendors'],
      summary: 'Get all vendors',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
        kycStatus: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: VendorListResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      page?: number; 
      limit?: number; 
      status?: string; 
      kycStatus?: string; 
      search?: string; 
    } 
  }>, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20, status, kycStatus, search } = request.query;

      logger.info('Fetching vendors', { page, limit, status, kycStatus, search });

      const filters: any = {};
      if (status) filters.status = status;
      if (kycStatus) filters.kycStatus = kycStatus;
      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // TODO: Replace with actual Prisma calls when vendor models are implemented
      const vendors = [];
      const total = 0;

      const totalPages = Math.ceil(total / limit);

      reply.send({
        vendors: vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          legalName: vendor.legalName,
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website,
          status: vendor.status,
          kycStatus: vendor.kycStatus,
          taxStatus: vendor.taxStatus,
          sanctionsStatus: vendor.sanctionsStatus,
          debarmentStatus: vendor.debarmentStatus,
          paymentMethod: vendor.paymentMethod,
          createdAt: vendor.createdAt.toISOString(),
          updatedAt: vendor.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error: any) {
      logger.error('Failed to fetch vendors', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch vendors',
      });
    }
  });

  /**
   * Get vendor by ID
   */
  fastify.get('/:id', {
    schema: {
      tags: ['Vendors'],
      summary: 'Get vendor by ID',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: VendorResponseSchema,
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(request.params.id);
      logger.info('Fetching vendor', { vendorId: id });

      // TODO: Replace with actual Prisma call when vendor models are implemented
      const vendor = null;

      if (!vendor) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Vendor ${id} not found`,
        });
        return;
      }

      reply.send({
        id: vendor.id,
        name: vendor.name,
        legalName: vendor.legalName,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        status: vendor.status,
        kycStatus: vendor.kycStatus,
        taxStatus: vendor.taxStatus,
        sanctionsStatus: vendor.sanctionsStatus,
        debarmentStatus: vendor.debarmentStatus,
        paymentMethod: vendor.paymentMethod,
        createdAt: vendor.createdAt.toISOString(),
        updatedAt: vendor.updatedAt.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to fetch vendor', { error: error.message, vendorId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor',
      });
    }
  });

  /**
   * Update vendor
   */
  fastify.put('/:id', {
    schema: {
      tags: ['Vendors'],
      summary: 'Update vendor',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: VendorUpdateSchema,
      response: {
        200: VendorResponseSchema,
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { id: number }; 
    Body: typeof VendorUpdateSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const id = parseInt(request.params.id);
      const updateData = {
        ...request.body,
        updatedBy: request.user?.userId || 0,
      };

      logger.info('Updating vendor', { vendorId: id, updatedBy: request.user?.userId });

      // TODO: Replace with actual Prisma call when vendor models are implemented
      const vendor = {
        id,
        name: 'Updated Vendor',
        legalName: null,
        email: null,
        phone: null,
        website: null,
        status: 'ACTIVE',
        kycStatus: 'PENDING',
        taxStatus: 'PENDING',
        sanctionsStatus: 'CLEAR',
        debarmentStatus: 'CLEAR',
        paymentMethod: 'BANK',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      reply.send({
        id: vendor.id,
        name: vendor.name,
        legalName: vendor.legalName,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        status: vendor.status,
        kycStatus: vendor.kycStatus,
        taxStatus: vendor.taxStatus,
        sanctionsStatus: vendor.sanctionsStatus,
        debarmentStatus: vendor.debarmentStatus,
        paymentMethod: vendor.paymentMethod,
        createdAt: vendor.createdAt.toISOString(),
        updatedAt: vendor.updatedAt.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to update vendor', { error: error.message, vendorId: request.params.id });
      
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
   * Upload KYC documents
   */
  fastify.post('/:id/documents', {
    schema: {
      tags: ['Vendors'],
      summary: 'Upload KYC documents',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Array(VendorDocumentUploadSchema),
      response: {
        201: Type.Object({
          message: Type.String(),
          uploadedCount: Type.Number(),
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
    Body: typeof VendorDocumentUploadSchema.static[]
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const documents = request.body.map(doc => ({
        ...doc,
        fileSize: BigInt(doc.fileSize),
        issueDate: doc.issueDate ? new Date(doc.issueDate) : undefined,
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
      }));

      logger.info('Uploading KYC documents', { 
        vendorId: id, 
        documentCount: documents.length,
        uploadedBy: request.user?.userId || 0,
      });

      await vendorService.submitKYCDocuments(id, documents);

      reply.code(201).send({
        message: 'Documents uploaded successfully',
        uploadedCount: documents.length,
      });
    } catch (error: any) {
      logger.error('Failed to upload documents', { error: error.message, vendorId: request.params.id });
      
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
   * Get vendor documents
   */
  fastify.get('/:id/documents', {
    schema: {
      tags: ['Vendors'],
      summary: 'Get vendor documents',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Array(DocumentResponseSchema),
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

      logger.info('Fetching vendor documents', { vendorId: id });

      // TODO: Replace with actual Prisma call when vendor models are implemented
      const vendor = null;

      if (!vendor) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Vendor ${id} not found`,
        });
        return;
      }

      // TODO: Replace with actual Prisma call when vendor models are implemented
      const documents = [];

      reply.send(documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        originalFileName: doc.originalFileName,
        documentType: doc.documentType,
        fileSize: doc.fileSize.toString(),
        mimeType: doc.mimeType,
        issueDate: doc.issueDate?.toISOString() || null,
        expiryDate: doc.expiryDate?.toISOString() || null,
        issuingAuthority: doc.issuingAuthority,
        uploadedAt: doc.uploadedAt.toISOString(),
      })));
    } catch (error: any) {
      logger.error('Failed to fetch vendor documents', { error: error.message, vendorId: request.params.id });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor documents',
      });
    }
  });

  /**
   * Review KYC status
   */
  fastify.put('/:id/kyc', {
    schema: {
      tags: ['Vendors'],
      summary: 'Review KYC status',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: KYCReviewSchema,
      response: {
        200: Type.Object({
          message: Type.String(),
          status: Type.String(),
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
    Body: typeof KYCReviewSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decision = {
        ...request.body,
        reviewedBy: request.user?.userId || 0,
      };

      logger.info('Reviewing KYC status', { 
        vendorId: id, 
        approved: decision.approved,
        reviewedBy: decision.reviewedBy,
      });

      await vendorService.reviewKYCStatus(id, decision);

      reply.send({
        message: `KYC ${decision.approved ? 'approved' : 'rejected'} successfully`,
        status: decision.approved ? 'APPROVED' : 'REJECTED',
      });
    } catch (error: any) {
      logger.error('Failed to review KYC status', { error: error.message, vendorId: request.params.id });
      
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
   * Update compliance status
   */
  fastify.put('/:id/compliance', {
    schema: {
      tags: ['Vendors'],
      summary: 'Update compliance status',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: ComplianceUpdateSchema,
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
  }, async (request: FastifyRequest<{ 
    Params: { id: number }; 
    Body: typeof ComplianceUpdateSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const checks = {
        ...request.body,
        reviewedBy: request.user?.userId || 0,
      };

      logger.info('Updating compliance status', { 
        vendorId: id,
        reviewedBy: checks.reviewedBy,
      });

      await vendorService.updateComplianceStatus(id, checks);

      reply.send({
        message: 'Compliance status updated successfully',
      });
    } catch (error: any) {
      logger.error('Failed to update compliance status', { error: error.message, vendorId: request.params.id });
      
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
   * Run sanctions check
   */
  fastify.post('/:id/sanctions-check', {
    schema: {
      tags: ['Vendors'],
      summary: 'Run sanctions check',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Object({
          sanctionsStatus: Type.String(),
          checkedAt: Type.String(),
          results: Type.Object({
            ofacMatches: Type.Number(),
            euMatches: Type.Number(),
            unMatches: Type.Number(),
          }),
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

      logger.info('Running sanctions check', { vendorId: id });

      const result = await vendorService.runSanctionsCheck(id);

      reply.send({
        sanctionsStatus: result.status,
        checkedAt: result.checkedAt.toISOString(),
        results: result.details || 'No additional details available',
      });
    } catch (error: any) {
      logger.error('Failed to run sanctions check', { error: error.message, vendorId: request.params.id });
      
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
          message: 'Failed to run sanctions check',
        });
      }
    }
  });

  /**
   * Run debarment check
   */
  fastify.post('/:id/debarment-check', {
    schema: {
      tags: ['Vendors'],
      summary: 'Run debarment check',
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: Type.Object({
          debarmentStatus: Type.String(),
          checkedAt: Type.String(),
          results: Type.Object({
            samMatches: Type.Number(),
            epslMatches: Type.Number(),
          }),
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

      logger.info('Running debarment check', { vendorId: id });

      const result = await vendorService.runDebarmentCheck(id);

      reply.send({
        debarmentStatus: result.status,
        checkedAt: result.checkedAt.toISOString(),
        results: result.details || 'No additional details available',
      });
    } catch (error: any) {
      logger.error('Failed to run debarment check', { error: error.message, vendorId: request.params.id });
      
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
          message: 'Failed to run debarment check',
        });
      }
    }
  });

  /**
   * Generate 1099 data
   */
  fastify.get('/:id/1099/:taxYear', {
    schema: {
      tags: ['Vendors'],
      summary: 'Generate 1099 data',
      params: Type.Object({
        id: Type.Number(),
        taxYear: Type.Number({ minimum: 2020, maximum: 2030 }),
      }),
      response: {
        200: Type.Object({
          vendorId: Type.Number(),
          taxYear: Type.Number(),
          totalPayments: Type.String(),
          paymentCount: Type.Number(),
          requires1099: Type.Boolean(),
          form1099Data: Type.Optional(Type.Object({
            recipientTin: Type.String(),
            recipientName: Type.String(),
            recipientAddress: Type.String(),
            totalPayments: Type.String(),
            backupWithholding: Type.String(),
          })),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { id: number; taxYear: number } 
  }>, reply: FastifyReply) => {
    try {
      const { id, taxYear } = request.params;

      logger.info('Generating 1099 data', { vendorId: id, taxYear });

      const data = await vendorService.generate1099Data(id, taxYear);

      reply.send({
        vendorId: data.vendorId,
        taxYear: data.taxYear,
        totalPayments: data.totalPaid.toString(),
        paymentCount: data.payments.length,
        requires1099: data.totalPaid > BigInt(600), // Standard 1099 threshold
        form1099Data: {
          recipientTin: data.taxId,
          recipientName: data.vendorName,
          recipientAddress: JSON.stringify(data.vendorAddress),
          totalPayments: data.totalPaid.toString(),
          backupWithholding: '0',
        },
      });
    } catch (error: any) {
      logger.error('Failed to generate 1099 data', { 
        error: error.message, 
        vendorId: request.params.id,
        taxYear: request.params.taxYear,
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
          message: 'Failed to generate 1099 data',
        });
      }
    }
  });
}