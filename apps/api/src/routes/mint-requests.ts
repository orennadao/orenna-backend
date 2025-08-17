// apps/api/src/routes/mint-requests.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { MintAuthorizationService } from '../lib/authorization.js';
import { MintingExecutionService } from '../lib/minting.js';
import { z } from 'zod';

// Validation schemas
const SubmitMintRequestSchema = z.object({
  projectId: z.number().int().positive(),
  tokenId: z.string().regex(/^\d+$/, 'Token ID must be numeric string'),
  amount: z.string().regex(/^\d+$/, 'Amount must be numeric string'),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  verificationData: z.record(z.any()).optional(),
  verificationHash: z.string().optional(),
});

const UpdateMintRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  approvalNotes: z.string().max(1000).optional(),
});

export default async function mintRequestRoutes(app: FastifyInstance) {
  // Create services inside the function where app is available
  const authService = new MintAuthorizationService(app);
  const mintingService = new MintingExecutionService(app);

  // Test endpoint for authorization
  app.get('/mint-requests/auth-test/:address/:projectId', async (request: FastifyRequest, reply) => {
    const { address, projectId } = request.params as { address: string; projectId: string };
    
    try {
      // Validate address format first
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return reply.code(400).send({ 
          error: 'Invalid Ethereum address format' 
        });
      }

      const result = await authService.canSubmitMintRequest(
        address, 
        parseInt(projectId), 
        1 // mainnet
      );
      
      return {
        address,
        projectId: parseInt(projectId),
        authorization: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error({ 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }, 
        address, 
        projectId 
      }, 'Authorization test failed');
      
      return reply.code(500).send({ 
        error: 'Authorization test failed',
        details: error.message 
      });
    }
  });

  // Test endpoint to check if Prisma is working
  app.get('/mint-requests/prisma-test', async (request, reply) => {
    try {
      // Test basic Prisma connection
      const projectCount = await app.prisma.project.count();
      const userCount = await app.prisma.user.count();
      
      return {
        prisma: 'connected',
        counts: {
          projects: projectCount,
          users: userCount
        }
      };
    } catch (error) {
      app.log.error({ error }, 'Prisma test failed');
      return reply.code(500).send({ 
        error: 'Prisma connection failed',
        details: error.message 
      });
    }
  });

  // Test endpoint to create a sample project for testing
  app.post('/mint-requests/create-test-project', async (request, reply) => {
    try {
      const project = await app.prisma.project.create({
        data: {
          name: 'Test Regenerative Project',
          slug: `test-project-${Date.now()}`,
          description: 'A test project for mint request authorization',
          ownerAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik's address
          chainId: 1
        }
      });

      return {
        message: 'Test project created',
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          ownerAddress: project.ownerAddress
        }
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to create test project');
      return reply.code(500).send({ 
        error: 'Failed to create test project',
        details: error.message 
      });
    }
  });

  // Test endpoint to create a mint request without auth (for testing)
  app.post('/mint-requests/create-test-request', async (request, reply) => {
    try {
      // Get the test project we created earlier
      const project = await app.prisma.project.findFirst({
        where: { name: 'Test Regenerative Project' }
      });

      if (!project) {
        return reply.code(404).send({ 
          error: 'Test project not found. Run create-test-project first.' 
        });
      }

      const mintRequest = await app.prisma.mintRequest.create({
        data: {
          projectId: project.id,
          tokenId: '1001', // Test token ID
          amount: '100', // 100 lift units
          recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik's address
          title: 'Forest Carbon Sequestration Verification',
          description: 'Verified carbon sequestration from 50 hectares of reforested land. Measurements show 2.5 tons CO2/hectare sequestered over 6 months.',
          requestedBy: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          verificationData: {
            carbonSequestered: '125 tons CO2',
            areaSize: '50 hectares',
            measurementPeriod: '6 months',
            verificationMethod: 'Soil sampling + satellite imagery',
            biodiversityIndex: 'Increased by 15%',
            waterQuality: 'Improved - pH 7.2, turbidity reduced 30%'
          },
          verificationHash: 'QmX4B9K2nE8F7H3L5M9N0P2Q6R8S1T4U7V0W3X6Y9Z2A5B8C1',
          status: 'PENDING'
        }
      });

      // Create submission event
      await app.prisma.mintRequestEvent.create({
        data: {
          mintRequestId: mintRequest.id,
          type: 'SUBMITTED',
          performedBy: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          notes: 'Test mint request for forest carbon sequestration',
          metadata: {
            testRequest: true,
            authorizationReason: 'Project owner'
          }
        }
      });

      return {
        message: 'Test mint request created',
        mintRequest: {
          id: mintRequest.id,
          status: mintRequest.status,
          title: mintRequest.title,
          tokenId: mintRequest.tokenId,
          amount: mintRequest.amount
        }
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to create test mint request');
      return reply.code(500).send({ error: 'Failed to create test mint request' });
    }
  });

  // Get mint requests (with filtering)
  app.get('/mint-requests', {
    schema: {
      description: 'Get mint requests',
      tags: ['Mint Requests'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          projectId: { type: 'number' },
          requestedBy: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const {
      status,
      projectId,
      requestedBy,
      limit = 50,
      offset = 0
    } = request.query as {
      status?: string;
      projectId?: number;
      requestedBy?: string;
      limit?: number;
      offset?: number;
    };

    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (requestedBy) where.requestedBy = requestedBy.toLowerCase();

    try {
      const [mintRequests, total] = await Promise.all([
        app.prisma.mintRequest.findMany({
          where,
          include: {
            project: {
              select: { id: true, name: true, slug: true }
            },
            events: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 100),
          skip: offset
        }),
        app.prisma.mintRequest.count({ where })
      ]);

      return {
        mintRequests,
        total,
        limit,
        offset
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to fetch mint requests');
      return reply.code(500).send({ error: 'Failed to fetch mint requests' });
    }
  });

  // Get specific mint request
  app.get('/mint-requests/:id', {
    schema: {
      description: 'Get mint request by ID',
      tags: ['Mint Requests'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    const { id } = request.params as { id: string };

    try {
      const mintRequest = await app.prisma.mintRequest.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              ownerAddress: true
            }
          },
          events: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!mintRequest) {
        return reply.code(404).send({ error: 'Mint request not found' });
      }

      return mintRequest;
    } catch (error) {
      app.log.error({ error, mintRequestId: id }, 'Failed to fetch mint request');
      return reply.code(500).send({ error: 'Failed to fetch mint request' });
    }
  });

  // Test approval endpoint (bypasses auth for testing)
  app.put('/mint-requests/:id/approve-test', async (request: FastifyRequest, reply) => {
    const { id } = request.params as { id: string };
    const { status, approvalNotes } = request.body as { status: 'APPROVED' | 'REJECTED'; approvalNotes?: string };

    try {
      // Get current mint request
      const currentRequest = await app.prisma.mintRequest.findUnique({
        where: { id }
      });

      if (!currentRequest) {
        return reply.code(404).send({ error: 'Mint request not found' });
      }

      if (currentRequest.status !== 'PENDING') {
        return reply.code(400).send({
          error: 'Can only approve/reject pending requests',
          currentStatus: currentRequest.status
        });
      }

      // Update the mint request
      const updatedRequest = await app.prisma.mintRequest.update({
        where: { id },
        data: {
          status: status || 'APPROVED',
          reviewedBy: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Test admin
          reviewedAt: new Date(),
          approvalNotes: approvalNotes || 'Test approval - verification data looks good'
        }
      });

      // Create approval event
      await app.prisma.mintRequestEvent.create({
        data: {
          mintRequestId: id,
          type: status || 'APPROVED',
          performedBy: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          notes: approvalNotes || 'Test approval - verification data looks good',
          metadata: {
            testApproval: true,
            previousStatus: currentRequest.status
          }
        }
      });

      return {
        id: updatedRequest.id,
        status: updatedRequest.status,
        message: `Mint request ${status?.toLowerCase() || 'approved'} successfully`,
        approvedAt: updatedRequest.reviewedAt
      };

    } catch (error) {
      app.log.error({ error, mintRequestId: id }, 'Failed to approve mint request');
      return reply.code(500).send({ error: 'Failed to approve mint request' });
    }
  });
// Execute minting for a specific approved request
  app.post('/mint-requests/:id/execute-mint', async (request: FastifyRequest, reply) => {
    const { id } = request.params as { id: string };

    try {
      // For testing, use a default executor address
      // In production, this would require admin authentication
      const executorAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

      const result = await mintingService.executeMinting(id, executorAddress);

      if (result.success) {
        return {
          success: true,
          message: 'Minting executed successfully',
          mintRequestId: id,
          txHash: result.txHash
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          mintRequestId: id
        });
      }

    } catch (error) {
      app.log.error({ error, mintRequestId: id }, 'Failed to execute minting');
      return reply.code(500).send({
        success: false,
        error: 'Failed to execute minting',
        details: error.message
      });
    }
  });

  // Process all approved requests (batch minting)
  app.post('/mint-requests/process-approved', async (request: FastifyRequest, reply) => {
    try {
      const { limit = 10 } = request.body as { limit?: number };
      const executorAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

      const results = await mintingService.processApprovedRequests(executorAddress, limit);

      return {
        message: 'Batch processing completed',
        summary: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed
        },
        results: results.results
      };

    } catch (error) {
      app.log.error({ error }, 'Failed to process approved requests');
      return reply.code(500).send({
        error: 'Failed to process approved requests',
        details: error.message
      });
    }
  });
}