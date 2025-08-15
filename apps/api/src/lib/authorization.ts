// apps/api/src/lib/authorization.ts
import { blockchainService } from './blockchain.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Authorization configuration
const MINT_REQUEST_CONFIG = {
  // Minimum ORNA tokens required to submit mint requests (in wei/smallest unit)
  // Total supply: 1,000,000 ORNA tokens
  MIN_ORNA_BALANCE: '100000000000000000000', // 100 ORNA tokens (0.01% of supply)
  
  // Alternative: Use voting power instead of balance (lower threshold for delegated tokens)
  MIN_VOTING_POWER: '50000000000000000000', // 50 ORNA voting power (0.005% of supply)
  
  // Cache authorization results for this many seconds to avoid excessive RPC calls
  CACHE_DURATION: 300, // 5 minutes
};

// Cache for authorization results
const authCache = new Map<string, { canMint: boolean; expires: number; reason?: string }>();

interface AuthorizationResult {
  canMint: boolean;
  reason?: string;
  ornaBalance?: string;
  votingPower?: string;
  isProjectOwner?: boolean;
}

export class MintAuthorizationService {
  constructor(private app: FastifyInstance) {}

  /**
   * Check if a user can submit mint requests for a specific project
   */
  async canSubmitMintRequest(
    userAddress: string, 
    projectId: number, 
    chainId: number = 1
  ): Promise<AuthorizationResult> {
    
    // Check cache first
    const cacheKey = `${userAddress}:${projectId}:${chainId}`;
    const cached = authCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return {
        canMint: cached.canMint,
        reason: cached.reason
      };
    }

    try {
      // 1. Check if user is the project owner
      const project = await this.app.prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerAddress: true, name: true }
      });

      if (!project) {
        const result = { canMint: false, reason: 'Project not found' };
        this.cacheResult(cacheKey, result);
        return result;
      }

      const isProjectOwner = project.ownerAddress?.toLowerCase() === userAddress.toLowerCase();

      if (isProjectOwner) {
        const result = { 
          canMint: true, 
          isProjectOwner: true,
          reason: 'Project owner' 
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // 2. Check ORNA token balance/voting power
      const ornaResult = await this.checkOrnaRequirements(userAddress, chainId);
      
      if (ornaResult.canMint) {
        this.cacheResult(cacheKey, ornaResult);
        return ornaResult;
      }

      // 3. Default: Not authorized
      const result = {
        canMint: false,
        reason: `Insufficient ORNA tokens. Need ${MINT_REQUEST_CONFIG.MIN_ORNA_BALANCE} wei, or be project owner`,
        ornaBalance: ornaResult.ornaBalance,
        votingPower: ornaResult.votingPower
      };
      
      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      this.app.log.error({ error, userAddress, projectId }, 'Authorization check failed');
      
      const result = {
        canMint: false,
        reason: 'Authorization check failed - please try again'
      };
      
      // Don't cache errors
      return result;
    }
  }

  /**
   * Check ORNA token requirements
   */
  private async checkOrnaRequirements(
    userAddress: string, 
    chainId: number
  ): Promise<AuthorizationResult> {
    
    try {
      // Get both balance and voting power
      const [ornaBalance, votingPower] = await Promise.all([
        blockchainService.getOrnaBalance(userAddress as `0x${string}`, chainId),
        blockchainService.getOrnaVotingPower(userAddress as `0x${string}`, chainId)
      ]);

      // Check if balance meets requirement
      const hasEnoughBalance = BigInt(ornaBalance) >= BigInt(MINT_REQUEST_CONFIG.MIN_ORNA_BALANCE);
      
      // Check if voting power meets requirement  
      const hasEnoughVotingPower = BigInt(votingPower) >= BigInt(MINT_REQUEST_CONFIG.MIN_VOTING_POWER);

      if (hasEnoughBalance || hasEnoughVotingPower) {
        return {
          canMint: true,
          reason: hasEnoughBalance ? 'Sufficient ORNA balance' : 'Sufficient voting power',
          ornaBalance,
          votingPower
        };
      }

      return {
        canMint: false,
        reason: `Insufficient ORNA. Balance: ${ornaBalance} wei, Voting Power: ${votingPower} wei`,
        ornaBalance,
        votingPower
      };

    } catch (error) {
      this.app.log.error({ error, userAddress }, 'Failed to check ORNA requirements');
      throw error;
    }
  }

  /**
   * Cache authorization result
   */
  private cacheResult(cacheKey: string, result: AuthorizationResult) {
    authCache.set(cacheKey, {
      canMint: result.canMint,
      reason: result.reason,
      expires: Date.now() + (MINT_REQUEST_CONFIG.CACHE_DURATION * 1000)
    });
  }

  /**
   * Clear cache for a specific user (useful when their balance changes)
   */
  clearUserCache(userAddress: string) {
    for (const [key] of authCache.entries()) {
      if (key.startsWith(`${userAddress}:`)) {
        authCache.delete(key);
      }
    }
  }

  /**
   * Middleware to check mint request authorization
   */
  requireMintAuthorization() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      const projectId = parseInt((request.params as any)?.projectId || (request.body as any)?.projectId);

      if (!user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      if (!projectId) {
        return reply.code(400).send({ error: 'Project ID required' });
      }

      const authResult = await this.canSubmitMintRequest(
        user.address, 
        projectId, 
        user.chainId || 1
      );

      if (!authResult.canMint) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions to submit mint requests',
          reason: authResult.reason,
          details: {
            ornaBalance: authResult.ornaBalance,
            votingPower: authResult.votingPower,
            isProjectOwner: authResult.isProjectOwner
          }
        });
      }

      // Add authorization info to request for use in handlers
      request.mintAuth = authResult;
    };
  }
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    mintAuth?: AuthorizationResult;
  }
}

// Export configuration for easy adjustment
export { MINT_REQUEST_CONFIG };