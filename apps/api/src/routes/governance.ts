// apps/api/src/routes/governance.ts
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { FastifyInstance } from 'fastify';
import { createGovernanceService } from '../lib/governance.js';
import { requireAuth } from '../lib/authorization.js';
import { PrismaClient } from '@orenna/db';

const ProposalCreateSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.String({ minLength: 1, maxLength: 5000 }),
  proposalType: Type.Union([
    Type.Literal('STANDARD'),
    Type.Literal('ECOSYSTEM_PARAMETER'),
    Type.Literal('METHOD_REGISTRY'),
    Type.Literal('PROTOCOL_UPGRADE'),
    Type.Literal('TREASURY_ALLOCATION'),
    Type.Literal('LIFT_TOKEN_GOVERNANCE'),
    Type.Literal('FINANCE_PLATFORM'),
    Type.Literal('FEE_ADJUSTMENT'),
    Type.Literal('EMERGENCY'),
  ]),
  targets: Type.Array(Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' })),
  values: Type.Array(Type.String()),
  calldatas: Type.Array(Type.String()),
  ecosystemData: Type.Optional(Type.Unknown()),
  methodRegistryData: Type.Optional(Type.Unknown()),
  financeData: Type.Optional(Type.Unknown()),
  liftTokenData: Type.Optional(Type.Unknown()),
  chainId: Type.Optional(Type.Integer({ minimum: 1 })),
});

const VoteRequestSchema = Type.Object({
  proposalId: Type.String(),
  support: Type.Union([
    Type.Literal(0), // Against
    Type.Literal(1), // For
    Type.Literal(2), // Abstain
  ]),
  reason: Type.Optional(Type.String({ maxLength: 1000 })),
  signature: Type.Optional(Type.Object({
    v: Type.Integer(),
    r: Type.String(),
    s: Type.String(),
  })),
});

const DelegationRequestSchema = Type.Object({
  delegatee: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
  chainId: Type.Optional(Type.Integer({ minimum: 1 })),
  signature: Type.Optional(Type.Object({
    v: Type.Integer(),
    r: Type.String(),
    s: Type.String(),
    nonce: Type.Integer(),
    expiry: Type.Integer(),
  })),
});

const SponsorshipRequestSchema = Type.Object({
  proposalId: Type.String(),
  chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  signature: Type.Optional(Type.Object({
    v: Type.Integer(),
    r: Type.String(),
    s: Type.String(),
  })),
});

const AntiSpamDepositSchema = Type.Object({
  proposalId: Type.String(),
  txHash: Type.String({ pattern: '^0x[a-fA-F0-9]{64}$' }),
  amount: Type.String(),
  chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
});

export async function governanceRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma as PrismaClient;
  const governanceService = createGovernanceService(fastify, prisma);

  // Get user's governance token information
  fastify.get('/governance/token', {
    schema: {
      querystring: Type.Object({
        chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { chainId = 1 } = request.query;
    const userAddress = request.user.address;

    try {
      const tokenInfo = await governanceService.getGovernanceToken(userAddress as any, chainId);
      
      return {
        success: true,
        data: tokenInfo,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get governance token');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get governance token information',
      };
    }
  });

  // Get governance proposals with pagination
  fastify.get('/governance/proposals', {
    schema: {
      querystring: Type.Object({
        chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        status: Type.Optional(Type.String()),
        proposalType: Type.Optional(Type.String()),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { chainId = 1, limit = 20, offset = 0, status, proposalType } = request.query;

    try {
      const result = await governanceService.getProposals(chainId, limit, offset, status, proposalType);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get proposals');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get proposals',
      };
    }
  });

  // Get specific proposal
  fastify.get('/governance/proposals/:proposalId', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;

    try {
      const proposal = await governanceService.getProposal(proposalId);
      
      return {
        success: true,
        data: proposal,
      };
    } catch (error) {
      if (error.message === 'Proposal not found') {
        reply.code(404);
        return {
          success: false,
          error: 'Proposal not found',
        };
      }
      
      fastify.log.error(error, 'Failed to get proposal');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get proposal',
      };
    }
  });

  // Create new proposal (preparation for on-chain submission)
  fastify.post('/governance/proposals', {
    schema: {
      body: ProposalCreateSchema,
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const proposalData = request.body;
    const userAddress = request.user.address;

    try {
      // Validate proposal data
      if (!Value.Check(ProposalCreateSchema, proposalData)) {
        reply.code(400);
        return {
          success: false,
          error: 'Invalid proposal data',
        };
      }

      const chainId = proposalData.chainId || 1;
      
      // Create proposal in database and prepare on-chain data
      const result = await governanceService.createProposal(
        userAddress as any,
        {
          title: proposalData.title,
          description: proposalData.description,
          proposalType: proposalData.proposalType,
          targets: proposalData.targets as any[],
          values: proposalData.values.map(v => BigInt(v)),
          calldatas: proposalData.calldatas,
          ecosystemData: proposalData.ecosystemData,
          methodRegistryData: proposalData.methodRegistryData,
          financeData: proposalData.financeData,
          liftTokenData: proposalData.liftTokenData,
        },
        chainId
      );

      reply.code(201);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to create proposal');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create proposal',
      };
    }
  });

  // Record vote (after on-chain transaction)
  fastify.post('/governance/proposals/:proposalId/vote', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      body: VoteRequestSchema,
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const voteData = request.body;
    const userAddress = request.user.address;

    try {
      // Validate vote data
      if (!Value.Check(VoteRequestSchema, voteData)) {
        reply.code(400);
        return {
          success: false,
          error: 'Invalid vote data',
        };
      }

      // Note: This endpoint records votes after they've been submitted on-chain
      // The actual voting happens via smart contract interaction
      const vote = await governanceService.recordVote(
        userAddress as any,
        proposalId,
        voteData.support,
        '0', // Voting power will be updated by indexer
        voteData.reason
      );

      return {
        success: true,
        data: vote,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to record vote');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to record vote',
      };
    }
  });

  // Record delegation (after on-chain transaction)
  fastify.post('/governance/delegate', {
    schema: {
      body: DelegationRequestSchema,
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const delegationData = request.body;
    const userAddress = request.user.address;

    try {
      // Validate delegation data
      if (!Value.Check(DelegationRequestSchema, delegationData)) {
        reply.code(400);
        return {
          success: false,
          error: 'Invalid delegation data',
        };
      }

      const chainId = delegationData.chainId || 1;

      // Note: This endpoint records delegation after it's been submitted on-chain
      // The actual delegation happens via smart contract interaction
      const delegation = await governanceService.recordDelegation(
        userAddress as any,
        delegationData.delegatee as any,
        '0', // Amount will be updated by indexer
        chainId
      );

      return {
        success: true,
        data: delegation,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to record delegation');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to record delegation',
      };
    }
  });

  // Get governance parameters
  fastify.get('/governance/parameters', {
    schema: {
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { category } = request.query;

    try {
      const parameters = await governanceService.getGovernanceParameters(category);
      
      return {
        success: true,
        data: parameters,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get governance parameters');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get governance parameters',
      };
    }
  });

  // Get governance metrics
  fastify.get('/governance/metrics', {
    schema: {
      querystring: Type.Object({
        chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        periodStart: Type.String({ format: 'date-time' }),
        periodEnd: Type.String({ format: 'date-time' }),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { chainId = 1, periodStart, periodEnd } = request.query;

    try {
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        reply.code(400);
        return {
          success: false,
          error: 'Invalid date format',
        };
      }

      const metrics = await governanceService.getGovernanceMetrics(startDate, endDate, chainId);
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get governance metrics');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get governance metrics',
      };
    }
  });

  // Upload proposal metadata to IPFS
  fastify.post('/governance/proposals/upload-metadata', {
    schema: {
      body: Type.Object({
        title: Type.String(),
        description: Type.String(),
        proposalType: Type.String(),
        metadata: Type.Unknown(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { title, description, proposalType, metadata } = request.body;

    try {
      // This would integrate with IPFS service
      // For now, return a mock hash
      const ipfsHash = `Qm${Buffer.from(JSON.stringify({ title, description, proposalType, metadata })).toString('hex').substring(0, 44)}`;
      
      return {
        success: true,
        data: {
          ipfsHash,
          metadataUri: `ipfs://${ipfsHash}`,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to upload metadata');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to upload metadata to IPFS',
      };
    }
  });

  // Submit sponsorship for a proposal
  fastify.post('/governance/proposals/:proposalId/sponsor', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      body: SponsorshipRequestSchema,
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const sponsorshipData = request.body;
    const userAddress = request.user.address;

    try {
      const chainId = sponsorshipData.chainId || 1;

      const result = await governanceService.submitSponsorship(
        userAddress as any,
        proposalId,
        chainId
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to submit sponsorship');
      
      if (error.message.includes('not found') || error.message.includes('not accepting')) {
        reply.code(400);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to submit sponsorship',
      };
    }
  });

  // Submit anti-spam deposit for a proposal
  fastify.post('/governance/proposals/:proposalId/deposit', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      body: AntiSpamDepositSchema,
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const depositData = request.body;
    const userAddress = request.user.address;

    try {
      const result = await governanceService.recordAntiSpamDeposit(
        userAddress as any,
        proposalId,
        depositData.txHash as any,
        depositData.amount,
        depositData.chainId || 1
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to record anti-spam deposit');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to record anti-spam deposit',
      };
    }
  });

  // Get proposal sponsorships
  fastify.get('/governance/proposals/:proposalId/sponsorships', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;

    try {
      const sponsorships = await governanceService.getProposalSponsorships(proposalId);
      
      return {
        success: true,
        data: sponsorships,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get proposal sponsorships');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get proposal sponsorships',
      };
    }
  });

  // Retrieve proposal metadata from IPFS
  fastify.get('/governance/proposals/:proposalId/metadata', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;

    try {
      const proposal = await governanceService.getProposal(proposalId);
      
      if (!proposal.ipfsHash) {
        reply.code(404);
        return {
          success: false,
          error: 'Proposal metadata not found',
        };
      }

      const metadata = await governanceService.retrieveProposalMetadata(proposal.ipfsHash);
      
      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to retrieve proposal metadata');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to retrieve proposal metadata',
      };
    }
  });

  // Check proposal requirements
  fastify.get('/governance/proposals/:proposalId/requirements', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;

    try {
      const requirements = await governanceService.getProposalRequirementsAndStatus(proposalId);
      
      return {
        success: true,
        data: requirements,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get proposal requirements');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get proposal requirements',
      };
    }
  });

  // Start voting period for a proposal
  fastify.post('/governance/proposals/:proposalId/start-voting', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      body: Type.Object({
        chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const { chainId = 1 } = request.body;

    try {
      const result = await governanceService.startVotingPeriod(proposalId, chainId);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to start voting period');
      
      if (error.message.includes('not found') || error.message.includes('requirements') || error.message.includes('not in pending')) {
        reply.code(400);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to start voting period',
      };
    }
  });

  // Check proposal quorum status
  fastify.get('/governance/proposals/:proposalId/quorum', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      querystring: Type.Object({
        chainId: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const { chainId = 1 } = request.query;

    try {
      const quorum = await governanceService.checkQuorum(proposalId, chainId);
      
      return {
        success: true,
        data: quorum,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to check quorum');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to check quorum',
      };
    }
  });

  // Finalize voting if period has ended
  fastify.post('/governance/proposals/:proposalId/finalize', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;

    try {
      const result = await governanceService.finalizeVotingIfEnded(proposalId);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to finalize voting');
      
      if (error.message.includes('not found')) {
        reply.code(404);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to finalize voting',
      };
    }
  });

  // Execute a proposal after timelock delay
  fastify.post('/governance/proposals/:proposalId/execute', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const executorAddress = request.user.address;

    try {
      const result = await governanceService.executeProposal(proposalId, executorAddress as any);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to execute proposal');
      
      if (error.message.includes('not found') || 
          error.message.includes('not queued') || 
          error.message.includes('Timelock not ready') ||
          error.message.includes('expired')) {
        reply.code(400);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to execute proposal',
      };
    }
  });

  // Cancel a queued proposal
  fastify.post('/governance/proposals/:proposalId/cancel', {
    schema: {
      params: Type.Object({
        proposalId: Type.String(),
      }),
      body: Type.Object({
        reason: Type.String({ minLength: 10, maxLength: 500 }),
      }),
    },
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { proposalId } = request.params;
    const { reason } = request.body;
    const cancellerAddress = request.user.address;

    try {
      const result = await governanceService.cancelQueuedProposal(
        proposalId,
        cancellerAddress as any,
        reason
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to cancel proposal');
      
      if (error.message.includes('not found') || 
          error.message.includes('not queued') || 
          error.message.includes('Insufficient permissions')) {
        reply.code(400);
        return {
          success: false,
          error: error.message,
        };
      }
      
      reply.code(500);
      return {
        success: false,
        error: 'Failed to cancel proposal',
      };
    }
  });

  // Get proposals ready for execution
  fastify.get('/governance/executable-proposals', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const executableProposals = await governanceService.getExecutableProposals();
      
      return {
        success: true,
        data: {
          proposals: executableProposals,
          count: executableProposals.length,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get executable proposals');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to get executable proposals',
      };
    }
  });

  // Health check endpoint
  fastify.get('/governance/health', async (request, reply) => {
    return {
      success: true,
      data: {
        service: 'governance',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  });
}