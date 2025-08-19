import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { blockchainService } from '../lib/blockchain.js';
import { getEnv } from '../types/env.js';
import { VerificationService } from '../lib/verification.js';
import { VWBAMethodologyHandler } from '../lib/verification/vwba.js';
import { EvidenceValidationPipeline } from '../lib/verification/evidence-pipeline.js';
import { MRVProtocolManager } from '../lib/verification/mrv.js';
import { createIPFSClient } from '../lib/ipfs-client.js';
import { createQueueService } from '../lib/queue-service.js';
import { createQueueProcessors } from '../lib/queue-processors.js';

const env = getEnv();

// Validation schemas
const CreateLiftTokenSchema = z.object({
  projectId: z.number().optional(),
  tokenId: z.string().regex(/^\d+$/, 'Token ID must be numeric string'),
  maxSupply: z.string().regex(/^\d+$/, 'Max supply must be numeric string'),
  quantity: z.string().optional(),
  unit: z.string().default('LU'),
  meta: z.record(z.any()).optional(),
  uri: z.string().url().optional(),
});

const IssuePayloadSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().regex(/^\d+$/, 'Amount must be numeric string'),
  chainId: z.number().int().positive().default(env.DEFAULT_CHAIN_ID),
  at: z.string().datetime().optional(),
  meta: z.record(z.any()).optional(),
});

const RetirePayloadSchema = z.object({
  retiredBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().regex(/^\d+$/, 'Amount must be numeric string'),
  reason: z.string().optional(),
  at: z.string().datetime().optional(),
  meta: z.record(z.any()).optional(),
});

// Verification schemas
const VerificationRequestSchema = z.object({
  methodId: z.string().min(1),
  validatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  validatorName: z.string().optional(),
  notes: z.string().optional(),
  evidence: z.array(z.object({
    evidenceType: z.string(),
    fileName: z.string(),
    fileContent: z.string(), // Base64 encoded
    mimeType: z.string(),
    captureDate: z.string().datetime().optional(),
    captureLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      altitude: z.number().optional()
    }).optional(),
    captureDevice: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional()
});

const VerificationMethodSchema = z.object({
  methodId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  methodologyType: z.string().min(1),
  version: z.string().default('1.0'),
  criteria: z.record(z.any()),
  requiredDataTypes: z.array(z.string()).optional(),
  minimumConfidence: z.number().min(0).max(1).optional(),
  validationPeriod: z.number().int().positive().optional(),
  registryContract: z.string().optional(),
  chainId: z.number().int().positive().optional(),
  methodHash: z.string().optional(),
  approvedValidators: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export default async function liftTokenRoutes(app: FastifyInstance) {
  
  // Initialize IPFS client for evidence storage
  const ipfsClient = createIPFSClient(app.log, {
    url: process.env.IPFS_API_URL || 'http://localhost:5001',
    timeout: 30000
  });

  // Initialize queue service for async processing
  const queueService = createQueueService(app.log, {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    concurrency: 3
  });

  // Initialize verification services
  const verificationService = new VerificationService(
    app.prisma,
    app.log,
    {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/json',
        'text/csv',
        'text/plain',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      confidenceThreshold: 0.8
    },
    ipfsClient,
    queueService
  );

  const evidencePipeline = new EvidenceValidationPipeline(app.prisma, app.log, ipfsClient);
  const mrvManager = new MRVProtocolManager(app.log);

  // Initialize queue processors for background tasks
  const queueProcessors = createQueueProcessors({
    prisma: app.prisma,
    logger: app.log,
    queueService,
    verificationService
  });

  // Register methodology handlers
  verificationService.registerMethodology(new VWBAMethodologyHandler());

  // Cleanup handler for graceful shutdown
  app.addHook('onClose', async () => {
    app.log.info('Closing queue service...');
    await queueService.close();
  });
  
  // Get all lift tokens
  app.get('/lift-tokens', {
    schema: {
      description: 'Get all lift tokens',
      tags: ['Lift Tokens'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          projectId: { type: 'number' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            liftTokens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  tokenId: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  quantity: { type: 'string', nullable: true },
                  unit: { type: 'string', nullable: true },
                  projectId: { type: 'number', nullable: true },
                  chainId: { type: 'number', nullable: true },
                  contractAddress: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { status, projectId, limit = 50, offset = 0 } = request.query as {
      status?: string;
      projectId?: number;
      limit?: number;
      offset?: number;
    };

    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    try {
      const [liftTokens, total] = await Promise.all([
        app.prisma.liftToken.findMany({
          where,
          include: {
            project: {
              select: { id: true, name: true, slug: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 100),
          skip: offset,
        }),
        app.prisma.liftToken.count({ where })
      ]);

      return {
        liftTokens: liftTokens.map(unit => ({
          ...unit,
          quantity: unit.quantity?.toString(),
          meta: unit.meta || {},
        })),
        total,
        limit,
        offset
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to fetch lift tokens');
      return reply.code(500).send({ error: 'Failed to fetch lift tokens' });
    }
  });

  // Get specific lift token
  app.get('/lift-tokens/:id', {
    schema: {
      description: 'Get lift token by ID',
      tags: ['Lift Tokens'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          includeBlockchainData: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            tokenId: { type: 'string', nullable: true },
            status: { type: 'string' },
            quantity: { type: 'string', nullable: true },
            unit: { type: 'string', nullable: true },
            projectId: { type: 'number', nullable: true },
            chainId: { type: 'number', nullable: true },
            contractAddress: { type: 'string', nullable: true },
            blockchainData: { type: 'object', nullable: true },
            events: { type: 'array' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { includeBlockchainData = false } = request.query as { includeBlockchainData?: boolean };

    try {
      const liftToken = await app.prisma.liftToken.findUnique({
        where: { id: Number(id) },
        include: {
          project: {
            select: { id: true, name: true, slug: true }
          },
          events: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!liftToken) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      let blockchainData = null;
      
      if (includeBlockchainData && liftToken.tokenId && liftToken.chainId) {
        try {
          blockchainData = await blockchainService.getLiftTokenInfo(
            liftToken.tokenId, 
            liftToken.chainId
          );
        } catch (error) {
          app.log.warn({ error, tokenId: liftToken.tokenId, chainId: liftToken.chainId }, 
            'Failed to fetch blockchain data for lift token');
        }
      }

      return {
        ...liftToken,
        quantity: liftToken.quantity?.toString(),
        meta: liftToken.meta || {},
        blockchainData,
        events: liftToken.events.map(event => ({
          ...event,
          payload: event.payload || {},
          meta: event.meta || {},
        }))
      };
    } catch (error) {
      app.log.error({ error, id }, 'Failed to fetch lift token');
      return reply.code(500).send({ error: 'Failed to fetch lift token' });
    }
  });

  // Create new lift token (requires authentication)
  app.post('/lift-tokens', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Create new lift token',
      tags: ['Lift Tokens'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['tokenId', 'maxSupply'],
        properties: {
          projectId: { type: 'number' },
          tokenId: { type: 'string' },
          maxSupply: { type: 'string' },
          quantity: { type: 'string' },
          unit: { type: 'string', default: 'LU' },
          meta: { type: 'object' },
          uri: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            tokenId: { type: 'string' },
            status: { type: 'string' },
            txHash: { type: 'string', nullable: true }
          }
        }
      }
    }
  }, async (request, reply) => {
    const body = CreateLiftTokenSchema.parse(request.body);
    const user = request.user!;

    try {
      // Check if token ID already exists
      const existingUnit = await app.prisma.liftToken.findFirst({
        where: { tokenId: body.tokenId }
      });

      if (existingUnit) {
        return reply.code(409).send({ error: 'Token ID already exists' });
      }

      // Create lift token in database first
      const liftToken = await app.prisma.liftToken.create({
        data: {
          tokenId: body.tokenId,
          projectId: body.projectId,
          quantity: body.quantity ? BigInt(body.quantity) : null,
          unit: body.unit,
          meta: body.meta || {},
          chainId: user.chainId || env.DEFAULT_CHAIN_ID,
          contractAddress: env.LIFT_TOKENS_ADDRESS,
          status: 'CREATED'
        }
      });

      let txHash = null;

      // Try to create token on blockchain if contracts are configured
      if (env.LIFT_TOKENS_ADDRESS && env.MINTER_PRIVATE_KEY) {
        try {
          const uri = body.uri || `${env.API_CORS_ORIGIN}/api/lift-tokens/${liftToken.id}/metadata`;
          
          txHash = await blockchainService.createLiftToken(
            body.tokenId,
            body.maxSupply,
            uri,
            user.chainId || env.DEFAULT_CHAIN_ID
          );

          // Record blockchain creation event
          await app.prisma.liftTokenEvent.create({
            data: {
              liftTokenId: liftToken.id,
              type: 'CREATED',
              txHash,
              payload: {
                tokenId: body.tokenId,
                maxSupply: body.maxSupply,
                uri,
                creator: user.address
              },
              eventAt: new Date()
            }
          });

          app.log.info({ 
            liftTokenId: liftToken.id, 
            tokenId: body.tokenId, 
            txHash 
          }, 'Lift unit created on blockchain');

        } catch (blockchainError) {
          app.log.error({ 
            error: blockchainError, 
            liftTokenId: liftToken.id 
          }, 'Failed to create lift token on blockchain');
          
          // Update status to indicate blockchain creation failed
          await app.prisma.liftToken.update({
            where: { id: liftToken.id },
            data: { status: 'CREATION_FAILED' }
          });
        }
      }

      return reply.code(201).send({
        id: liftToken.id,
        tokenId: liftToken.tokenId!,
        status: liftToken.status,
        txHash
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error }, 'Failed to create lift token');
      return reply.code(500).send({ error: 'Failed to create lift token' });
    }
  });

  // Issue lift tokens (mint tokens)
  app.post('/lift-tokens/:id/issue', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Issue (mint) lift tokens to an address',
      tags: ['Lift Tokens'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['to', 'amount'],
        properties: {
          to: { type: 'string' },
          amount: { type: 'string' },
          chainId: { type: 'number' },
          at: { type: 'string' },
          meta: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            id: { type: 'number' },
            status: { type: 'string' },
            eventId: { type: 'number' },
            txHash: { type: 'string', nullable: true },
            idempotent: { type: 'boolean', default: false }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = IssuePayloadSchema.parse(request.body);
    const user = request.user!;

    const liftTokenId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();

    try {
      // Check if lift token exists and can be issued
      const liftToken = await app.prisma.liftToken.findUnique({
        where: { id: liftTokenId }
      });

      if (!liftToken) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      if (!['CREATED', 'DRAFT'].includes(liftToken.status)) {
        return reply.code(409).send({ 
          error: 'Invalid state transition',
          from: liftToken.status,
          to: 'ISSUED'
        });
      }

      let txHash = null;

      // Try to mint on blockchain first
      if (liftToken.tokenId && liftToken.chainId && env.LIFT_TOKENS_ADDRESS && env.MINTER_PRIVATE_KEY) {
        try {
          txHash = await blockchainService.mintLiftToken(
            body.to as `0x${string}`,
            liftToken.tokenId,
            body.amount,
            body.chainId
          );

          app.log.info({ 
            liftTokenId, 
            tokenId: liftToken.tokenId, 
            to: body.to,
            amount: body.amount,
            txHash 
          }, 'Lift units minted on blockchain');

        } catch (blockchainError) {
          app.log.error({ 
            error: blockchainError, 
            liftTokenId,
            tokenId: liftToken.tokenId 
          }, 'Failed to mint lift tokens on blockchain');
          
          return reply.code(500).send({ error: 'Blockchain minting failed' });
        }
      }

      // Create event record (idempotent via unique constraint)
      const event = await app.prisma.liftTokenEvent.create({
        data: {
          liftTokenId,
          type: 'ISSUED',
          txHash,
          payload: {
            ...body,
            issuedBy: user.address
          },
          meta: body.meta || {},
          eventAt
        }
      });

      // Update lift token status
      const updatedUnit = await app.prisma.liftToken.update({
        where: { id: liftTokenId },
        data: { 
          status: 'ISSUED', 
          issuedAt: eventAt 
        }
      });

      return {
        ok: true,
        id: updatedUnit.id,
        status: updatedUnit.status,
        eventId: event.id,
        txHash
      };

    } catch (error: any) {
      // Handle idempotent case (duplicate transaction)
      if (error?.code === 'P2002') {
        const existing = await app.prisma.liftTokenEvent.findFirst({
          where: { 
            liftTokenId, 
            type: 'ISSUED', 
            txHash: txHash || undefined 
          }
        });
        
        return {
          ok: true,
          id: liftTokenId,
          status: 'ISSUED',
          eventId: existing?.id,
          txHash,
          idempotent: true
        };
      }

      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error, liftTokenId }, 'Failed to issue lift tokens');
      return reply.code(500).send({ error: 'Failed to issue lift tokens' });
    }
  });

  // Retire lift tokens
  app.post('/lift-tokens/:id/retire', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Retire lift tokens',
      tags: ['Lift Tokens'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['retiredBy', 'amount'],
        properties: {
          retiredBy: { type: 'string' },
          amount: { type: 'string' },
          reason: { type: 'string' },
          at: { type: 'string' },
          meta: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            id: { type: 'number' },
            status: { type: 'string' },
            eventId: { type: 'number' },
            idempotent: { type: 'boolean', default: false }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = RetirePayloadSchema.parse(request.body);
    const user = request.user!;

    const liftTokenId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();

    try {
      // Check if lift token exists and can be retired
      const liftToken = await app.prisma.liftToken.findUnique({
        where: { id: liftTokenId }
      });

      if (!liftToken) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      if (liftToken.status !== 'ISSUED') {
        return reply.code(409).send({ 
          error: 'Invalid state transition',
          from: liftToken.status,
          to: 'RETIRED'
        });
      }

      // Create retirement event
      const event = await app.prisma.liftTokenEvent.create({
        data: {
          liftTokenId,
          type: 'RETIRED',
          payload: {
            ...body,
            processedBy: user.address
          },
          meta: body.meta || {},
          eventAt
        }
      });

      // Update lift token status
      const updatedUnit = await app.prisma.liftToken.update({
        where: { id: liftTokenId },
        data: { 
          status: 'RETIRED', 
          retiredAt: eventAt 
        }
      });

      return {
        ok: true,
        id: updatedUnit.id,
        status: updatedUnit.status,
        eventId: event.id
      };

    } catch (error: any) {
      // Handle idempotent case
      if (error?.code === 'P2002') {
        const existing = await app.prisma.liftTokenEvent.findFirst({
          where: { liftTokenId, type: 'RETIRED' }
        });
        
        return {
          ok: true,
          id: liftTokenId,
          status: 'RETIRED',
          eventId: existing?.id,
          idempotent: true
        };
      }

      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error, liftTokenId }, 'Failed to retire lift tokens');
      return reply.code(500).send({ error: 'Failed to retire lift tokens' });
    }
  });

  // Get lift token metadata (for ERC-1155 URI)
  app.get('/lift-tokens/:id/metadata', {
    schema: {
      description: 'Get lift token metadata in ERC-1155 format',
      tags: ['Lift Tokens'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' },
            external_url: { type: 'string' },
            attributes: { type: 'array' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const liftToken = await app.prisma.liftToken.findUnique({
        where: { id: Number(id) },
        include: {
          project: {
            select: { name: true, description: true, slug: true }
          }
        }
      });

      if (!liftToken) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      // Format as ERC-1155 metadata standard
      const metadata = {
        name: `Lift Token #${liftToken.tokenId || liftToken.id}`,
        description: liftToken.project?.description || 
          `Ecosystem function lift token representing verified environmental improvements.`,
        image: `${env.API_CORS_ORIGIN}/api/lift-tokens/${liftToken.id}/image`,
        external_url: `${env.API_CORS_ORIGIN}/projects/${liftToken.project?.slug || liftToken.projectId}`,
        attributes: [
          {
            trait_type: 'Status',
            value: liftToken.status
          },
          {
            trait_type: 'Unit Type',
            value: liftToken.unit || 'LU'
          },
          {
            trait_type: 'Project',
            value: liftToken.project?.name || 'Unknown'
          },
          {
            trait_type: 'Chain ID',
            value: liftToken.chainId
          },
          ...(liftToken.quantity ? [{
            trait_type: 'Quantity',
            value: liftToken.quantity.toString(),
            display_type: 'number'
          }] : []),
          ...(liftToken.issuedAt ? [{
            trait_type: 'Issued Date',
            value: liftToken.issuedAt.toISOString().split('T')[0],
            display_type: 'date'
          }] : [])
        ]
      };

      // Add custom metadata attributes
      if (liftToken.meta && typeof liftToken.meta === 'object') {
        Object.entries(liftToken.meta).forEach(([key, value]) => {
          metadata.attributes.push({
            trait_type: key,
            value: String(value)
          });
        });
      }

      return metadata;

    } catch (error) {
      app.log.error({ error, id }, 'Failed to fetch lift token metadata');
      return reply.code(500).send({ error: 'Failed to fetch metadata' });
    }
  });

  // ================================
  // VERIFICATION ENDPOINTS
  // ================================

  // Submit verification request
  app.post('/lift-tokens/:id/verify', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Submit verification request for lift token',
      tags: ['Verification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['methodId', 'validatorAddress'],
        properties: {
          methodId: { type: 'string' },
          validatorAddress: { type: 'string' },
          validatorName: { type: 'string' },
          notes: { type: 'string' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                evidenceType: { type: 'string' },
                fileName: { type: 'string' },
                fileContent: { type: 'string' },
                mimeType: { type: 'string' },
                captureDate: { type: 'string' },
                captureLocation: { type: 'object' },
                captureDevice: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            liftTokenId: { type: 'number' },
            methodId: { type: 'string' },
            status: { type: 'string' },
            verificationDate: { type: 'string' },
            evidenceCount: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = VerificationRequestSchema.parse(request.body);
    const user = request.user!;

    try {
      // Convert base64 evidence to buffer format
      const evidenceSubmissions = body.evidence?.map(e => ({
        evidenceType: e.evidenceType,
        fileName: e.fileName,
        fileContent: Buffer.from(e.fileContent, 'base64'),
        mimeType: e.mimeType,
        captureDate: e.captureDate ? new Date(e.captureDate) : undefined,
        captureLocation: e.captureLocation,
        captureDevice: e.captureDevice,
        metadata: e.metadata
      }));

      const verificationResult = await verificationService.submitVerification({
        liftTokenId: Number(id),
        methodId: body.methodId,
        validatorAddress: body.validatorAddress,
        validatorName: body.validatorName,
        notes: body.notes,
        evidence: evidenceSubmissions
      });

      return reply.code(201).send({
        id: verificationResult.id,
        liftTokenId: verificationResult.liftTokenId,
        methodId: verificationResult.methodId,
        status: verificationResult.status,
        verificationDate: verificationResult.verificationDate.toISOString(),
        evidenceCount: evidenceSubmissions?.length || 0
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error, liftTokenId: id }, 'Failed to submit verification');
      return reply.code(500).send({ error: 'Failed to submit verification' });
    }
  });

  // Get verification status
  app.get('/lift-tokens/:id/verification-status', {
    schema: {
      description: 'Get verification status for lift token',
      tags: ['Verification'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            verified: { type: 'boolean' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  methodId: { type: 'string' },
                  verified: { type: 'boolean' },
                  confidenceScore: { type: 'number' },
                  status: { type: 'string' },
                  verificationDate: { type: 'string' },
                  validatorAddress: { type: 'string' },
                  evidenceCount: { type: 'number' }
                }
              }
            },
            pending: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const status = await verificationService.getVerificationStatus(Number(id));

      return {
        verified: status.verified,
        results: status.results.map(result => ({
          id: result.id,
          methodId: result.methodId,
          verified: result.verified,
          confidenceScore: result.confidenceScore ? Number(result.confidenceScore) : null,
          status: result.status,
          verificationDate: result.verificationDate.toISOString(),
          validatorAddress: result.validatorAddress,
          evidenceCount: result.evidenceFiles?.length || 0
        })),
        pending: status.pending.map(result => ({
          id: result.id,
          methodId: result.methodId,
          status: result.status,
          submittedAt: result.submittedAt.toISOString()
        }))
      };

    } catch (error) {
      app.log.error({ error, liftTokenId: id }, 'Failed to get verification status');
      return reply.code(500).send({ error: 'Failed to get verification status' });
    }
  });

  // Perform verification calculation
  app.post('/verification-results/:id/calculate', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Perform verification calculation',
      tags: ['Verification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            verified: { type: 'boolean' },
            confidenceScore: { type: 'number' },
            status: { type: 'string' },
            calculationData: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const result = await verificationService.performVerification(Number(id));

      return {
        id: result.id,
        verified: result.verified,
        confidenceScore: result.confidenceScore ? Number(result.confidenceScore) : null,
        status: result.status,
        calculationData: result.calculationData
      };

    } catch (error) {
      app.log.error({ error, verificationResultId: id }, 'Failed to perform verification');
      return reply.code(500).send({ error: 'Failed to perform verification' });
    }
  });

  // Process evidence for verification
  app.post('/verification-results/:id/process-evidence', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Process evidence files for verification',
      tags: ['Verification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            processed: { type: 'boolean' },
            overallScore: { type: 'number' },
            qualityGrade: { type: 'string' },
            issueCount: { type: 'number' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const result = await evidencePipeline.processEvidence(Number(id));

      return {
        processed: result.processed,
        overallScore: result.overallScore,
        qualityGrade: result.qualityGrade,
        issueCount: result.issues.length,
        processingTime: result.processingTime
      };

    } catch (error) {
      app.log.error({ error, verificationResultId: id }, 'Failed to process evidence');
      return reply.code(500).send({ error: 'Failed to process evidence' });
    }
  });

  // Get MRV compliance assessment
  app.get('/verification-results/:id/mrv-assessment', {
    schema: {
      description: 'Get MRV compliance assessment for verification',
      tags: ['Verification'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          protocolName: { type: 'string', default: 'Water Conservation MRV' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            measurementCompliance: { type: 'object' },
            reportingCompliance: { type: 'object' },
            verificationCompliance: { type: 'object' },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { protocolName = 'Water Conservation MRV' } = request.query as { protocolName?: string };

    try {
      // Get verification result with evidence
      const verificationResult = await app.prisma.verificationResult.findUnique({
        where: { id: Number(id) },
        include: { evidenceFiles: true }
      });

      if (!verificationResult) {
        return reply.code(404).send({ error: 'Verification result not found' });
      }

      const assessment = await mrvManager.assessMRVCompliance(
        protocolName,
        verificationResult.evidenceFiles,
        verificationResult
      );

      return assessment;

    } catch (error) {
      app.log.error({ error, verificationResultId: id }, 'Failed to assess MRV compliance');
      return reply.code(500).send({ error: 'Failed to assess MRV compliance' });
    }
  });

  // Get available verification methods
  app.get('/verification-methods', {
    schema: {
      description: 'Get available verification methods',
      tags: ['Verification'],
      querystring: {
        type: 'object',
        properties: {
          methodologyType: { type: 'string' },
          active: { type: 'boolean', default: true },
          chainId: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            methods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  methodId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  methodologyType: { type: 'string' },
                  version: { type: 'string' },
                  minimumConfidence: { type: 'number' },
                  requiredDataTypes: { type: 'array' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { methodologyType, active = true, chainId } = request.query as {
      methodologyType?: string;
      active?: boolean;
      chainId?: number;
    };

    try {
      const methods = await verificationService.getVerificationMethods({
        methodologyType,
        active,
        chainId
      });

      return {
        methods: methods.map(method => ({
          methodId: method.methodId,
          name: method.name,
          description: method.description,
          methodologyType: method.methodologyType,
          version: method.version,
          minimumConfidence: method.minimumConfidence ? Number(method.minimumConfidence) : null,
          requiredDataTypes: method.requiredDataTypes
        }))
      };

    } catch (error) {
      app.log.error({ error }, 'Failed to get verification methods');
      return reply.code(500).send({ error: 'Failed to get verification methods' });
    }
  });

  // Register new verification method
  app.post('/verification-methods', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Register new verification method',
      tags: ['Verification'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['methodId', 'name', 'methodologyType', 'criteria'],
        properties: {
          methodId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          methodologyType: { type: 'string' },
          version: { type: 'string' },
          criteria: { type: 'object' },
          requiredDataTypes: { type: 'array' },
          minimumConfidence: { type: 'number' },
          validationPeriod: { type: 'number' },
          registryContract: { type: 'string' },
          chainId: { type: 'number' },
          methodHash: { type: 'string' },
          approvedValidators: { type: 'array' },
          metadata: { type: 'object' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            methodId: { type: 'string' },
            name: { type: 'string' },
            active: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const body = VerificationMethodSchema.parse(request.body);

    try {
      const method = await verificationService.registerVerificationMethod(body);

      return reply.code(201).send({
        id: method.id,
        methodId: method.methodId,
        name: method.name,
        active: method.active
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error }, 'Failed to register verification method');
      return reply.code(500).send({ error: 'Failed to register verification method' });
    }
  });

  // Get available MRV protocols
  app.get('/mrv-protocols', {
    schema: {
      description: 'Get available MRV protocols',
      tags: ['Verification'],
      response: {
        200: {
          type: 'object',
          properties: {
            protocols: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  measurementRequirements: { type: 'array' },
                  reportingRequirements: { type: 'array' },
                  verificationRequirements: { type: 'array' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const protocols = mrvManager.getProtocols();
      return { protocols };
    } catch (error) {
      app.log.error({ error }, 'Failed to get MRV protocols');
      return reply.code(500).send({ error: 'Failed to get MRV protocols' });
    }
  });

  // ================================
  // BATCH VERIFICATION ENDPOINTS
  // ================================

  // Submit batch verification request
  app.post('/lift-tokens/batch/verify', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Submit batch verification request for multiple lift tokens',
      tags: ['Verification', 'Batch'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['liftTokenIds', 'methodId', 'validatorAddress'],
        properties: {
          liftTokenIds: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1,
            maxItems: 100
          },
          methodId: { type: 'string' },
          validatorAddress: { type: 'string' },
          validatorName: { type: 'string' },
          notes: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                evidenceType: { type: 'string' },
                fileName: { type: 'string' },
                fileContent: { type: 'string' },
                mimeType: { type: 'string' },
                appliesToLiftTokens: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of lift token IDs this evidence applies to. If empty, applies to all.'
                },
                captureDate: { type: 'string' },
                captureLocation: { type: 'object' },
                captureDevice: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            totalUnits: { type: 'number' },
            submittedVerifications: { type: 'number' },
            failedSubmissions: { type: 'number' },
            estimatedCompletionTime: { type: 'string' },
            verificationResults: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  liftTokenId: { type: 'string' },
                  verificationId: { type: 'number' },
                  status: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as {
      liftTokenIds: string[];
      methodId: string;
      validatorAddress: string;
      validatorName?: string;
      notes?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      evidence?: any[];
    };
    const user = request.user!;

    try {
      const batchResult = await processBatchVerification(app, {
        liftTokenIds: body.liftTokenIds,
        methodId: body.methodId,
        validatorAddress: body.validatorAddress,
        validatorName: body.validatorName,
        notes: body.notes,
        priority: body.priority || 'normal',
        evidence: body.evidence || [],
        submittedBy: user.address
      });

      return reply.code(201).send(batchResult);

    } catch (error) {
      app.log.error({ error }, 'Failed to process batch verification');
      return reply.code(500).send({ error: 'Failed to process batch verification' });
    }
  });

  // Get batch verification status
  app.get('/lift-tokens/batch/:batchId/status', {
    schema: {
      description: 'Get status of batch verification operation',
      tags: ['Verification', 'Batch'],
      params: {
        type: 'object',
        required: ['batchId'],
        properties: {
          batchId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            status: { type: 'string' },
            totalUnits: { type: 'number' },
            completedUnits: { type: 'number' },
            failedUnits: { type: 'number' },
            pendingUnits: { type: 'number' },
            progressPercentage: { type: 'number' },
            estimatedTimeRemaining: { type: 'string' },
            startedAt: { type: 'string' },
            completedAt: { type: 'string' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  liftTokenId: { type: 'string' },
                  verificationId: { type: 'number' },
                  status: { type: 'string' },
                  verified: { type: 'boolean' },
                  confidence: { type: 'number' },
                  completedAt: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { batchId } = request.params as { batchId: string };

    try {
      const batchStatus = await getBatchVerificationStatus(app, batchId);
      return batchStatus;
    } catch (error) {
      app.log.error({ error, batchId }, 'Failed to get batch verification status');
      return reply.code(500).send({ error: 'Failed to get batch verification status' });
    }
  });

  // Cancel batch verification
  app.delete('/lift-tokens/batch/:batchId', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Cancel ongoing batch verification operation',
      tags: ['Verification', 'Batch'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['batchId'],
        properties: {
          batchId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            cancelled: { type: 'boolean' },
            reason: { type: 'string' },
            unitsProcessed: { type: 'number' },
            unitsCancelled: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { batchId } = request.params as { batchId: string };
    const user = request.user!;

    try {
      const cancellationResult = await cancelBatchVerification(app, batchId, user.address);
      return cancellationResult;
    } catch (error) {
      app.log.error({ error, batchId }, 'Failed to cancel batch verification');
      return reply.code(500).send({ error: 'Failed to cancel batch verification' });
    }
  });

  // Bulk verification status check
  app.post('/lift-tokens/bulk/status', {
    schema: {
      description: 'Check verification status for multiple lift tokens',
      tags: ['Verification', 'Batch'],
      body: {
        type: 'object',
        required: ['liftTokenIds'],
        properties: {
          liftTokenIds: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1,
            maxItems: 500
          },
          includeHistory: { type: 'boolean', default: false },
          includeEvidence: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalUnits: { type: 'number' },
                verifiedUnits: { type: 'number' },
                pendingUnits: { type: 'number' },
                failedUnits: { type: 'number' },
                unverifiedUnits: { type: 'number' }
              }
            },
            units: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  liftTokenId: { type: 'string' },
                  verificationStatus: { type: 'string' },
                  latestVerification: { type: 'object' },
                  verificationHistory: { type: 'array' },
                  evidenceCount: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as {
      liftTokenIds: string[];
      includeHistory: boolean;
      includeEvidence: boolean;
    };

    try {
      const bulkStatus = await getBulkVerificationStatus(app, {
        liftTokenIds: body.liftTokenIds,
        includeHistory: body.includeHistory || false,
        includeEvidence: body.includeEvidence || false
      });

      return bulkStatus;
    } catch (error) {
      app.log.error({ error }, 'Failed to get bulk verification status');
      return reply.code(500).send({ error: 'Failed to get bulk verification status' });
    }
  });

  // Batch re-verification endpoint
  app.post('/lift-tokens/batch/re-verify', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Re-verify failed or expired verifications in batch',
      tags: ['Verification', 'Batch'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          criteria: {
            type: 'object',
            properties: {
              projectId: { type: 'number' },
              methodId: { type: 'string' },
              failedSince: { type: 'string', format: 'date-time' },
              expiredSince: { type: 'string', format: 'date-time' },
              confidenceBelow: { type: 'number', minimum: 0, maximum: 1 },
              liftTokenIds: { type: 'array', items: { type: 'string' } }
            }
          },
          validatorAddress: { type: 'string' },
          validatorName: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as {
      criteria: {
        projectId?: number;
        methodId?: string;
        failedSince?: string;
        expiredSince?: string;
        confidenceBelow?: number;
        liftTokenIds?: string[];
      };
      validatorAddress: string;
      validatorName?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      notes?: string;
    };
    const user = request.user!;

    try {
      const reVerificationResult = await processBatchReVerification(app, {
        criteria: body.criteria,
        validatorAddress: body.validatorAddress,
        validatorName: body.validatorName,
        priority: body.priority || 'normal',
        notes: body.notes,
        submittedBy: user.address
      });

      return reply.code(201).send(reVerificationResult);
    } catch (error) {
      app.log.error({ error }, 'Failed to process batch re-verification');
      return reply.code(500).send({ error: 'Failed to process batch re-verification' });
    }
  });
}

// Batch Verification Helper Functions
async function processBatchVerification(app: FastifyInstance, options: {
  liftTokenIds: string[];
  methodId: string;
  validatorAddress: string;
  validatorName?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  evidence: any[];
  submittedBy: string;
}) {
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();

  // Validate lift tokens exist
  const liftTokens = await app.prisma.liftToken.findMany({
    where: { id: { in: options.liftTokenIds.map(id => parseInt(id)) } },
    select: { id: true, projectId: true, status: true }
  });

  if (liftTokens.length !== options.liftTokenIds.length) {
    const foundIds = liftTokens.map(lu => lu.id.toString());
    const missingIds = options.liftTokenIds.filter(id => !foundIds.includes(id));
    throw new Error(`Lift units not found: ${missingIds.join(', ')}`);
  }

  // Create batch verification record
  const batchRecord = await app.prisma.batchVerification.create({
    data: {
      batchId,
      status: 'PROCESSING',
      totalUnits: liftTokens.length,
      methodId: options.methodId,
      validatorAddress: options.validatorAddress,
      validatorName: options.validatorName,
      priority: options.priority,
      notes: options.notes,
      submittedBy: options.submittedBy,
      startedAt: startTime,
      metadata: {
        liftTokenIds: options.liftTokenIds,
        evidenceCount: options.evidence.length
      }
    }
  });

  const verificationResults: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each lift token
  for (const liftToken of liftTokens) {
    try {
      // Filter evidence applicable to this lift token
      const applicableEvidence = options.evidence.filter(e => 
        !e.appliesToLiftTokens || 
        e.appliesToLiftTokens.length === 0 || 
        e.appliesToLiftTokens.includes(liftToken.id.toString())
      );

      // Convert evidence format
      const evidenceSubmissions = applicableEvidence.map(e => ({
        evidenceType: e.evidenceType,
        fileName: e.fileName,
        fileContent: Buffer.from(e.fileContent, 'base64'),
        mimeType: e.mimeType,
        captureDate: e.captureDate ? new Date(e.captureDate) : undefined,
        captureLocation: e.captureLocation,
        captureDevice: e.captureDevice,
        metadata: e.metadata
      }));

      // Create verification service instance
      const verificationService = new VerificationService(app);

      // Submit verification
      const verificationResult = await verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: options.methodId,
        validatorAddress: options.validatorAddress,
        validatorName: options.validatorName,
        notes: `${options.notes || ''} [Batch: ${batchId}]`,
        evidence: evidenceSubmissions
      });

      // Add to queue with priority
      const queueService = createQueueService(app);
      await queueService.addVerificationJob({
        verificationId: verificationResult.id,
        priority: options.priority
      });

      verificationResults.push({
        liftTokenId: liftToken.id.toString(),
        verificationId: verificationResult.id,
        status: 'SUBMITTED',
        error: null
      });

      successCount++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      verificationResults.push({
        liftTokenId: liftToken.id.toString(),
        verificationId: null,
        status: 'FAILED',
        error: errorMessage
      });

      failureCount++;
    }
  }

  // Update batch record with results
  await app.prisma.batchVerification.update({
    where: { id: batchRecord.id },
    data: {
      submittedVerifications: successCount,
      failedSubmissions: failureCount,
      status: failureCount === liftTokens.length ? 'FAILED' : 'PROCESSING'
    }
  });

  // Estimate completion time based on queue depth and processing rate
  const estimatedMinutes = Math.ceil(successCount * 2); // Assume 2 minutes per verification
  const estimatedCompletionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();

  return {
    batchId,
    totalUnits: liftTokens.length,
    submittedVerifications: successCount,
    failedSubmissions: failureCount,
    estimatedCompletionTime,
    verificationResults
  };
}

async function getBatchVerificationStatus(app: FastifyInstance, batchId: string) {
  // Get batch record
  const batchRecord = await app.prisma.batchVerification.findUnique({
    where: { batchId }
  });

  if (!batchRecord) {
    throw new Error(`Batch verification not found: ${batchId}`);
  }

  const liftTokenIds = (batchRecord.metadata as any)?.liftTokenIds || [];
  
  // Get verification results for all units in the batch
  const verificationResults = await app.prisma.verificationResult.findMany({
    where: {
      liftTokenId: { in: liftTokenIds.map((id: string) => parseInt(id)) },
      notes: { contains: `[Batch: ${batchId}]` }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate progress
  const completedUnits = verificationResults.filter(r => r.verified !== null).length;
  const failedUnits = verificationResults.filter(r => r.verified === false).length;
  const pendingUnits = batchRecord.totalUnits - completedUnits;
  const progressPercentage = (completedUnits / batchRecord.totalUnits) * 100;

  // Estimate time remaining
  const avgProcessingTime = 2 * 60 * 1000; // 2 minutes in ms
  const estimatedTimeRemaining = pendingUnits > 0 
    ? new Date(Date.now() + (pendingUnits * avgProcessingTime)).toISOString()
    : null;

  // Determine overall status
  let status = batchRecord.status;
  if (completedUnits === batchRecord.totalUnits) {
    status = failedUnits > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
  }

  return {
    batchId,
    status,
    totalUnits: batchRecord.totalUnits,
    completedUnits,
    failedUnits,
    pendingUnits,
    progressPercentage,
    estimatedTimeRemaining,
    startedAt: batchRecord.startedAt?.toISOString(),
    completedAt: status.startsWith('COMPLETED') ? new Date().toISOString() : null,
    results: verificationResults.map(r => ({
      liftTokenId: r.liftTokenId.toString(),
      verificationId: r.id,
      status: r.verified === null ? 'PENDING' : r.verified ? 'VERIFIED' : 'FAILED',
      verified: r.verified,
      confidence: r.confidenceScore?.toNumber(),
      completedAt: r.verifiedAt?.toISOString(),
      error: r.verified === false ? 'Verification failed' : null
    }))
  };
}

async function cancelBatchVerification(app: FastifyInstance, batchId: string, cancelledBy: string) {
  const batchRecord = await app.prisma.batchVerification.findUnique({
    where: { batchId }
  });

  if (!batchRecord) {
    throw new Error(`Batch verification not found: ${batchId}`);
  }

  if (batchRecord.status === 'COMPLETED' || batchRecord.status === 'CANCELLED') {
    throw new Error(`Cannot cancel batch verification with status: ${batchRecord.status}`);
  }

  const liftTokenIds = (batchRecord.metadata as any)?.liftTokenIds || [];
  
  // Get pending verifications
  const pendingVerifications = await app.prisma.verificationResult.findMany({
    where: {
      liftTokenId: { in: liftTokenIds.map((id: string) => parseInt(id)) },
      notes: { contains: `[Batch: ${batchId}]` },
      verified: null
    }
  });

  // Cancel pending verifications (this would integrate with queue service)
  const queueService = createQueueService(app);
  for (const verification of pendingVerifications) {
    try {
      await queueService.cancelJob(`verification-${verification.id}`);
    } catch (error) {
      // Log but don't fail the cancellation
      app.log.warn({ verificationId: verification.id, error }, 'Failed to cancel verification job');
    }
  }

  // Update batch status
  await app.prisma.batchVerification.update({
    where: { batchId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy
    }
  });

  const processedCount = batchRecord.totalUnits - pendingVerifications.length;
  
  return {
    batchId,
    cancelled: true,
    reason: 'Cancelled by user request',
    unitsProcessed: processedCount,
    unitsCancelled: pendingVerifications.length
  };
}

async function getBulkVerificationStatus(app: FastifyInstance, options: {
  liftTokenIds: string[];
  includeHistory: boolean;
  includeEvidence: boolean;
}) {
  const liftTokenIdsInt = options.liftTokenIds.map(id => parseInt(id));
  
  // Get verification results
  const verificationResults = await app.prisma.verificationResult.findMany({
    where: { liftTokenId: { in: liftTokenIdsInt } },
    include: {
      evidenceFiles: options.includeEvidence,
      liftToken: { select: { id: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by lift token
  const unitMap = new Map();
  verificationResults.forEach(result => {
    const unitId = result.liftTokenId.toString();
    if (!unitMap.has(unitId)) {
      unitMap.set(unitId, {
        liftTokenId: unitId,
        verifications: [],
        latestVerification: null,
        verificationStatus: 'UNVERIFIED'
      });
    }
    unitMap.get(unitId).verifications.push(result);
  });

  // Process each unit
  const units = [];
  let verifiedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let unverifiedCount = 0;

  for (const unitId of options.liftTokenIds) {
    const unitData = unitMap.get(unitId);
    
    if (!unitData || unitData.verifications.length === 0) {
      units.push({
        liftTokenId: unitId,
        verificationStatus: 'UNVERIFIED',
        latestVerification: null,
        verificationHistory: options.includeHistory ? [] : undefined,
        evidenceCount: 0
      });
      unverifiedCount++;
      continue;
    }

    const latestVerification = unitData.verifications[0];
    let status = 'UNVERIFIED';
    
    if (latestVerification.verified === true) {
      status = 'VERIFIED';
      verifiedCount++;
    } else if (latestVerification.verified === false) {
      status = 'FAILED';
      failedCount++;
    } else {
      status = 'PENDING';
      pendingCount++;
    }

    units.push({
      liftTokenId: unitId,
      verificationStatus: status,
      latestVerification: {
        id: latestVerification.id,
        methodId: latestVerification.methodId,
        verified: latestVerification.verified,
        confidence: latestVerification.confidenceScore?.toNumber(),
        verifiedAt: latestVerification.verifiedAt?.toISOString(),
        validatorAddress: latestVerification.validatorAddress
      },
      verificationHistory: options.includeHistory ? unitData.verifications.slice(1).map((v: any) => ({
        id: v.id,
        methodId: v.methodId,
        verified: v.verified,
        confidence: v.confidenceScore?.toNumber(),
        verifiedAt: v.verifiedAt?.toISOString()
      })) : undefined,
      evidenceCount: latestVerification.evidenceFiles?.length || 0
    });
  }

  return {
    summary: {
      totalUnits: options.liftTokenIds.length,
      verifiedUnits: verifiedCount,
      pendingUnits: pendingCount,
      failedUnits: failedCount,
      unverifiedUnits: unverifiedCount
    },
    units
  };
}

async function processBatchReVerification(app: FastifyInstance, options: {
  criteria: {
    projectId?: number;
    methodId?: string;
    failedSince?: string;
    expiredSince?: string;
    confidenceBelow?: number;
    liftTokenIds?: string[];
  };
  validatorAddress: string;
  validatorName?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  notes?: string;
  submittedBy: string;
}) {
  const { criteria } = options;
  
  // Build query for verifications that need re-verification
  const whereClause: any = {};
  
  if (criteria.projectId) {
    whereClause.liftToken = { projectId: criteria.projectId };
  }
  
  if (criteria.methodId) {
    whereClause.methodId = criteria.methodId;
  }
  
  if (criteria.liftTokenIds && criteria.liftTokenIds.length > 0) {
    whereClause.liftTokenId = { in: criteria.liftTokenIds.map(id => parseInt(id)) };
  }
  
  if (criteria.failedSince) {
    whereClause.verified = false;
    whereClause.verifiedAt = { gte: new Date(criteria.failedSince) };
  }
  
  if (criteria.expiredSince) {
    whereClause.verifiedAt = { lte: new Date(criteria.expiredSince) };
  }
  
  if (criteria.confidenceBelow) {
    whereClause.confidenceScore = { lt: criteria.confidenceBelow };
  }

  // Get verifications that match criteria
  const targetVerifications = await app.prisma.verificationResult.findMany({
    where: whereClause,
    include: { liftToken: true },
    distinct: ['liftTokenId'], // Only get latest verification per lift token
    orderBy: { createdAt: 'desc' }
  });

  const liftTokenIds = targetVerifications.map(v => v.liftTokenId.toString());
  
  // Process batch verification
  return processBatchVerification(app, {
    liftTokenIds,
    methodId: criteria.methodId || targetVerifications[0]?.methodId || 'default',
    validatorAddress: options.validatorAddress,
    validatorName: options.validatorName,
    notes: `${options.notes || ''} [Re-verification batch]`,
    priority: options.priority,
    evidence: [], // Re-verification uses existing evidence
    submittedBy: options.submittedBy
  });
}
