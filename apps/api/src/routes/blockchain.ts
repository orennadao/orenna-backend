import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { blockchainService } from '../lib/blockchain.js';
import { getEnv } from '../types/env.js';

const env = getEnv();

// Validation schemas
const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
const ChainIdSchema = z.number().int().positive();
const TokenIdSchema = z.string().regex(/^\d+$/, 'Token ID must be numeric string');

export default async function blockchainRoutes(app: FastifyInstance) {
  
  // ORNA Token Routes
  app.get('/blockchain/orna/info', {
    schema: {
      description: 'Get ORNA token information',
      tags: ['Blockchain', 'ORNA'],
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            symbol: { type: 'string' },
            decimals: { type: 'number' },
            totalSupply: { type: 'string' },
            contractAddress: { type: 'string' },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { chainId = env.DEFAULT_CHAIN_ID } = request.query as { chainId?: number };
    
    try {
      const tokenInfo = await blockchainService.getOrnaTokenInfo(chainId);
      
      return {
        ...tokenInfo,
        contractAddress: env.ORNA_TOKEN_ADDRESS,
        chainId
      };
    } catch (error) {
      app.log.error({ error, chainId }, 'Failed to fetch ORNA token info');
      return reply.code(500).send({ error: 'Failed to fetch token information' });
    }
  });

  app.get('/blockchain/orna/balance/:address', {
    schema: {
      description: 'Get ORNA token balance for an address',
      tags: ['Blockchain', 'ORNA'],
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            balance: { type: 'string' },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { address } = request.params as { address: string };
    const { chainId = env.DEFAULT_CHAIN_ID } = request.query as { chainId?: number };
    
    try {
      AddressSchema.parse(address);
      ChainIdSchema.parse(chainId);
      
      const balance = await blockchainService.getOrnaBalance(address as `0x${string}`, chainId);
      
      return {
        address: address.toLowerCase(),
        balance,
        chainId
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid address format' });
      }
      
      app.log.error({ error, address, chainId }, 'Failed to fetch ORNA balance');
      return reply.code(500).send({ error: 'Failed to fetch balance' });
    }
  });

  app.get('/blockchain/orna/voting-power/:address', {
    schema: {
      description: 'Get voting power for an address',
      tags: ['Blockchain', 'ORNA'],
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID },
          blockNumber: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            votingPower: { type: 'string' },
            chainId: { type: 'number' },
            blockNumber: { type: 'string', nullable: true }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { address } = request.params as { address: string };
    const { chainId = env.DEFAULT_CHAIN_ID, blockNumber } = request.query as { 
      chainId?: number; 
      blockNumber?: string; 
    };
    
    try {
      AddressSchema.parse(address);
      ChainIdSchema.parse(chainId);
      
      const blockNum = blockNumber ? BigInt(blockNumber) : undefined;
      const votingPower = await blockchainService.getOrnaVotingPower(
        address as `0x${string}`, 
        chainId, 
        blockNum
      );
      
      return {
        address: address.toLowerCase(),
        votingPower,
        chainId,
        blockNumber: blockNumber || null
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid address format' });
      }
      
      app.log.error({ error, address, chainId }, 'Failed to fetch voting power');
      return reply.code(500).send({ error: 'Failed to fetch voting power' });
    }
  });

    // Lift Tokens Routes
    app.get('/blockchain/lift-tokens/:tokenId', {
      schema: {
        description: 'Get lift token information',
        tags: ['Blockchain', 'Lift Tokens'],
      params: {
        type: 'object',
        required: ['tokenId'],
        properties: {
          tokenId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tokenId: { type: 'string' },
            uri: { type: 'string' },
            totalSupply: { type: 'string' },
            maxSupply: { type: 'string' },
            contractAddress: { type: 'string' },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { tokenId } = request.params as { tokenId: string };
    const { chainId = env.DEFAULT_CHAIN_ID } = request.query as { chainId?: number };
    
    try {
      TokenIdSchema.parse(tokenId);
      ChainIdSchema.parse(chainId);
      
        const tokenInfo = await blockchainService.getLiftTokenInfo(tokenId, chainId);
      
      return {
        ...tokenInfo,
        contractAddress: env.LIFT_TOKENS_ADDRESS,
        chainId
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid token ID format' });
      }
      
        app.log.error({ error, tokenId, chainId }, 'Failed to fetch lift token info');
      return reply.code(500).send({ error: 'Failed to fetch token information' });
    }
  });

    app.get('/blockchain/lift-tokens/:tokenId/balance/:address', {
      schema: {
        description: 'Get lift token balance for an address',
        tags: ['Blockchain', 'Lift Tokens'],
      params: {
        type: 'object',
        required: ['tokenId', 'address'],
        properties: {
          tokenId: { type: 'string' },
          address: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tokenId: { type: 'string' },
            address: { type: 'string' },
            balance: { type: 'string' },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { tokenId, address } = request.params as { tokenId: string; address: string };
    const { chainId = env.DEFAULT_CHAIN_ID } = request.query as { chainId?: number };
    
    try {
      TokenIdSchema.parse(tokenId);
      AddressSchema.parse(address);
      ChainIdSchema.parse(chainId);
      
      const balance = await blockchainService.getLiftTokenBalance(
        address as `0x${string}`, 
        tokenId, 
        chainId
      );
      
      return {
        tokenId,
        address: address.toLowerCase(),
        balance,
        chainId
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters' });
      }
      
      app.log.error({ error, tokenId, address, chainId }, 'Failed to fetch lift token balance');
      return reply.code(500).send({ error: 'Failed to fetch balance' });
    }
  });

  // Authenticated routes for current user
  app.get('/blockchain/my/orna-balance', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Get ORNA balance for authenticated user',
      tags: ['Blockchain', 'User'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            balance: { type: 'string' },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { chainId = env.DEFAULT_CHAIN_ID } = request.query as { chainId?: number };
    const user = request.user!;
    
    try {
      const balance = await blockchainService.getOrnaBalance(user.address as `0x${string}`, chainId);
      
      return {
        address: user.address,
        balance,
        chainId
      };
    } catch (error) {
      app.log.error({ error, address: user.address, chainId }, 'Failed to fetch user ORNA balance');
      return reply.code(500).send({ error: 'Failed to fetch balance' });
    }
  });

  app.get('/blockchain/my/lift-tokens', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Get lift token balances for authenticated user',
      tags: ['Blockchain', 'User'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          chainId: { type: 'number', default: env.DEFAULT_CHAIN_ID },
          tokenIds: { type: 'string' } // comma-separated token IDs
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            balances: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tokenId: { type: 'string' },
                  balance: { type: 'string' }
                }
              }
            },
            chainId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { chainId = env.DEFAULT_CHAIN_ID, tokenIds } = request.query as { 
      chainId?: number; 
      tokenIds?: string; 
    };
    const user = request.user!;
    
    try {
      if (!tokenIds) {
        return {
          address: user.address,
          balances: [],
          chainId
        };
      }
      
      const tokenIdArray = tokenIds.split(',').map(id => id.trim());
      const balances = await blockchainService.getLiftTokenBalances(
        user.address as `0x${string}`, 
        tokenIdArray, 
        chainId
      );
      
      const result = tokenIdArray.map((tokenId, index) => ({
        tokenId,
        balance: balances[index]
      }));
      
      return {
        address: user.address,
        balances: result,
        chainId
      };
    } catch (error) {
      app.log.error({ error, address: user.address, chainId }, 'Failed to fetch user lift token balances');
      return reply.code(500).send({ error: 'Failed to fetch balances' });
    }
  });
}
