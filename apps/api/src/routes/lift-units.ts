import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { blockchainService } from '../lib/blockchain.js';
import { getEnv } from '../types/env.js';

const env = getEnv();

// Validation schemas
const CreateLiftUnitSchema = z.object({
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

export default async function liftUnitRoutes(app: FastifyInstance) {
  
  // Get all lift units
  app.get('/lift-units', {
    schema: {
      description: 'Get all lift units',
      tags: ['Lift Units'],
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
            liftUnits: {
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
      const [liftUnits, total] = await Promise.all([
        app.prisma.liftUnit.findMany({
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
        app.prisma.liftUnit.count({ where })
      ]);

      return {
        liftUnits: liftUnits.map(unit => ({
          ...unit,
          quantity: unit.quantity?.toString(),
          meta: unit.meta || {},
        })),
        total,
        limit,
        offset
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to fetch lift units');
      return reply.code(500).send({ error: 'Failed to fetch lift units' });
    }
  });

  // Get specific lift unit
  app.get('/lift-units/:id', {
    schema: {
      description: 'Get lift unit by ID',
      tags: ['Lift Units'],
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
      const liftUnit = await app.prisma.liftUnit.findUnique({
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

      if (!liftUnit) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      let blockchainData = null;
      
      if (includeBlockchainData && liftUnit.tokenId && liftUnit.chainId) {
        try {
          blockchainData = await blockchainService.getLiftUnitInfo(
            liftUnit.tokenId, 
            liftUnit.chainId
          );
        } catch (error) {
          app.log.warn({ error, tokenId: liftUnit.tokenId, chainId: liftUnit.chainId }, 
            'Failed to fetch blockchain data for lift unit');
        }
      }

      return {
        ...liftUnit,
        quantity: liftUnit.quantity?.toString(),
        meta: liftUnit.meta || {},
        blockchainData,
        events: liftUnit.events.map(event => ({
          ...event,
          payload: event.payload || {},
          meta: event.meta || {},
        }))
      };
    } catch (error) {
      app.log.error({ error, id }, 'Failed to fetch lift unit');
      return reply.code(500).send({ error: 'Failed to fetch lift unit' });
    }
  });

  // Create new lift unit (requires authentication)
  app.post('/lift-units', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Create new lift unit',
      tags: ['Lift Units'],
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
    const body = CreateLiftUnitSchema.parse(request.body);
    const user = request.user!;

    try {
      // Check if token ID already exists
      const existingUnit = await app.prisma.liftUnit.findFirst({
        where: { tokenId: body.tokenId }
      });

      if (existingUnit) {
        return reply.code(409).send({ error: 'Token ID already exists' });
      }

      // Create lift unit in database first
      const liftUnit = await app.prisma.liftUnit.create({
        data: {
          tokenId: body.tokenId,
          projectId: body.projectId,
          quantity: body.quantity ? BigInt(body.quantity) : null,
          unit: body.unit,
          meta: body.meta || {},
          chainId: user.chainId || env.DEFAULT_CHAIN_ID,
          contractAddress: env.LIFT_UNITS_ADDRESS,
          status: 'CREATED'
        }
      });

      let txHash = null;

      // Try to create token on blockchain if contracts are configured
      if (env.LIFT_UNITS_ADDRESS && env.MINTER_PRIVATE_KEY) {
        try {
          const uri = body.uri || `${env.API_BASE_URL}/api/lift-units/${liftUnit.id}/metadata`;
          
          txHash = await blockchainService.createLiftUnit(
            body.tokenId,
            body.maxSupply,
            uri,
            user.chainId || env.DEFAULT_CHAIN_ID
          );

          // Record blockchain creation event
          await app.prisma.liftUnitEvent.create({
            data: {
              liftUnitId: liftUnit.id,
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
            liftUnitId: liftUnit.id, 
            tokenId: body.tokenId, 
            txHash 
          }, 'Lift unit created on blockchain');

        } catch (blockchainError) {
          app.log.error({ 
            error: blockchainError, 
            liftUnitId: liftUnit.id 
          }, 'Failed to create lift unit on blockchain');
          
          // Update status to indicate blockchain creation failed
          await app.prisma.liftUnit.update({
            where: { id: liftUnit.id },
            data: { status: 'CREATION_FAILED' }
          });
        }
      }

      return reply.code(201).send({
        id: liftUnit.id,
        tokenId: liftUnit.tokenId!,
        status: liftUnit.status,
        txHash
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request format',
          details: error.errors
        });
      }

      app.log.error({ error }, 'Failed to create lift unit');
      return reply.code(500).send({ error: 'Failed to create lift unit' });
    }
  });

  // Issue lift units (mint tokens)
  app.post('/lift-units/:id/issue', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Issue (mint) lift units to an address',
      tags: ['Lift Units'],
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

    const liftUnitId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();

    try {
      // Check if lift unit exists and can be issued
      const liftUnit = await app.prisma.liftUnit.findUnique({
        where: { id: liftUnitId }
      });

      if (!liftUnit) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      if (!['CREATED', 'DRAFT'].includes(liftUnit.status)) {
        return reply.code(409).send({ 
          error: 'Invalid state transition',
          from: liftUnit.status,
          to: 'ISSUED'
        });
      }

      let txHash = null;

      // Try to mint on blockchain first
      if (liftUnit.tokenId && liftUnit.chainId && env.LIFT_UNITS_ADDRESS && env.MINTER_PRIVATE_KEY) {
        try {
          txHash = await blockchainService.mintLiftUnit(
            body.to as `0x${string}`,
            liftUnit.tokenId,
            body.amount,
            body.chainId
          );

          app.log.info({ 
            liftUnitId, 
            tokenId: liftUnit.tokenId, 
            to: body.to,
            amount: body.amount,
            txHash 
          }, 'Lift units minted on blockchain');

        } catch (blockchainError) {
          app.log.error({ 
            error: blockchainError, 
            liftUnitId,
            tokenId: liftUnit.tokenId 
          }, 'Failed to mint lift units on blockchain');
          
          return reply.code(500).send({ error: 'Blockchain minting failed' });
        }
      }

      // Create event record (idempotent via unique constraint)
      const event = await app.prisma.liftUnitEvent.create({
        data: {
          liftUnitId,
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

      // Update lift unit status
      const updatedUnit = await app.prisma.liftUnit.update({
        where: { id: liftUnitId },
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
        const existing = await app.prisma.liftUnitEvent.findFirst({
          where: { 
            liftUnitId, 
            type: 'ISSUED', 
            txHash: txHash || undefined 
          }
        });
        
        return {
          ok: true,
          id: liftUnitId,
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

      app.log.error({ error, liftUnitId }, 'Failed to issue lift units');
      return reply.code(500).send({ error: 'Failed to issue lift units' });
    }
  });

  // Retire lift units
  app.post('/lift-units/:id/retire', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Retire lift units',
      tags: ['Lift Units'],
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

    const liftUnitId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();

    try {
      // Check if lift unit exists and can be retired
      const liftUnit = await app.prisma.liftUnit.findUnique({
        where: { id: liftUnitId }
      });

      if (!liftUnit) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      if (liftUnit.status !== 'ISSUED') {
        return reply.code(409).send({ 
          error: 'Invalid state transition',
          from: liftUnit.status,
          to: 'RETIRED'
        });
      }

      // Create retirement event
      const event = await app.prisma.liftUnitEvent.create({
        data: {
          liftUnitId,
          type: 'RETIRED',
          payload: {
            ...body,
            processedBy: user.address
          },
          meta: body.meta || {},
          eventAt
        }
      });

      // Update lift unit status
      const updatedUnit = await app.prisma.liftUnit.update({
        where: { id: liftUnitId },
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
        const existing = await app.prisma.liftUnitEvent.findFirst({
          where: { liftUnitId, type: 'RETIRED' }
        });
        
        return {
          ok: true,
          id: liftUnitId,
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

      app.log.error({ error, liftUnitId }, 'Failed to retire lift units');
      return reply.code(500).send({ error: 'Failed to retire lift units' });
    }
  });

  // Get lift unit metadata (for ERC-1155 URI)
  app.get('/lift-units/:id/metadata', {
    schema: {
      description: 'Get lift unit metadata in ERC-1155 format',
      tags: ['Lift Units'],
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
      const liftUnit = await app.prisma.liftUnit.findUnique({
        where: { id: Number(id) },
        include: {
          project: {
            select: { name: true, description: true, slug: true }
          }
        }
      });

      if (!liftUnit) {
        return reply.code(404).send({ error: 'Lift unit not found' });
      }

      // Format as ERC-1155 metadata standard
      const metadata = {
        name: `Lift Unit #${liftUnit.tokenId || liftUnit.id}`,
        description: liftUnit.project?.description || 
          `Ecosystem function lift unit representing verified environmental improvements.`,
        image: `${env.API_BASE_URL}/api/lift-units/${liftUnit.id}/image`,
        external_url: `${env.API_CORS_ORIGIN}/projects/${liftUnit.project?.slug || liftUnit.projectId}`,
        attributes: [
          {
            trait_type: 'Status',
            value: liftUnit.status
          },
          {
            trait_type: 'Unit Type',
            value: liftUnit.unit || 'LU'
          },
          {
            trait_type: 'Project',
            value: liftUnit.project?.name || 'Unknown'
          },
          {
            trait_type: 'Chain ID',
            value: liftUnit.chainId
          },
          ...(liftUnit.quantity ? [{
            trait_type: 'Quantity',
            value: liftUnit.quantity.toString(),
            display_type: 'number'
          }] : []),
          ...(liftUnit.issuedAt ? [{
            trait_type: 'Issued Date',
            value: liftUnit.issuedAt.toISOString().split('T')[0],
            display_type: 'date'
          }] : [])
        ]
      };

      // Add custom metadata attributes
      if (liftUnit.meta && typeof liftUnit.meta === 'object') {
        Object.entries(liftUnit.meta).forEach(([key, value]) => {
          metadata.attributes.push({
            trait_type: key,
            value: String(value)
          });
        });
      }

      return metadata;

    } catch (error) {
      app.log.error({ error, id }, 'Failed to fetch lift unit metadata');
      return reply.code(500).send({ error: 'Failed to fetch metadata' });
    }
  });
}
