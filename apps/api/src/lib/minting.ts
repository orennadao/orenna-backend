// apps/api/src/lib/minting.ts
import { FastifyInstance } from 'fastify';
import { blockchainService } from './blockchain.js';
import { getEnv } from '../types/env.js';

const env = getEnv();

export class MintingExecutionService {
  constructor(private app: FastifyInstance) {}

  /**
   * Execute minting for an approved mint request
   */
  async executeMinting(mintRequestId: string, executorAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // Get the mint request
    const mintRequest = await this.app.prisma.mintRequest.findUnique({
      where: { id: mintRequestId },
      include: { project: true }
    });

    if (!mintRequest) {
      throw new Error('Mint request not found');
    }

    if (mintRequest.status !== 'APPROVED') {
      throw new Error(`Cannot mint request with status: ${mintRequest.status}`);
    }

    try {
      // Update status to MINTING
      await this.updateMintingStatus(mintRequestId, 'MINTING', executorAddress, 'Starting blockchain minting process');

      // Step 1: Ensure token exists on blockchain (create if needed)
      const tokenExists = await this.ensureTokenExists(mintRequest);
      
      if (!tokenExists.success) {
        await this.updateMintingStatus(mintRequestId, 'FAILED', executorAddress, `Failed to create token: ${tokenExists.error}`);
        return { success: false, error: tokenExists.error };
      }

      // Step 2: Mint the tokens
      this.app.log.info({
        mintRequestId,
        tokenId: mintRequest.tokenId,
        amount: mintRequest.amount,
        recipient: mintRequest.recipient
      }, 'Executing mint transaction');

      const mintResult = await this.mintTokens(mintRequest);

      if (!mintResult.success) {
        await this.updateMintingStatus(mintRequestId, 'FAILED', executorAddress, `Minting failed: ${mintResult.error}`);
        return { success: false, error: mintResult.error };
      }

      // Step 3: Wait for transaction confirmation
      const chainId = mintRequest.project?.chainId || env.DEFAULT_CHAIN_ID;
      const receipt = await blockchainService.waitForTransaction(mintResult.txHash!, chainId);

      // Step 4: Update to COMPLETED
      const completedRequest = await this.app.prisma.mintRequest.update({
        where: { id: mintRequestId },
        data: {
          status: 'COMPLETED',
          txHash: mintResult.txHash,
          blockNumber: Number(receipt.blockNumber),
          executedAt: new Date()
        }
      });

      // Create completion event
      await this.app.prisma.mintRequestEvent.create({
        data: {
          mintRequestId,
          type: 'MINT_COMPLETED',
          performedBy: executorAddress,
          notes: `Successfully minted ${mintRequest.amount} tokens`,
          txHash: mintResult.txHash,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed?.toString(),
          metadata: {
            tokenId: mintRequest.tokenId,
            amount: mintRequest.amount,
            recipient: mintRequest.recipient,
            confirmations: 1
          }
        }
      });

      // Step 5: Create or update the LiftToken record
      await this.createLiftTokenRecord(mintRequest, mintResult.txHash!, receipt);

      this.app.log.info({
        mintRequestId,
        txHash: mintResult.txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      }, 'Mint request completed successfully');

      return {
        success: true,
        txHash: mintResult.txHash
      };

    } catch (error) {
      this.app.log.error({ error, mintRequestId }, 'Minting execution failed');
      
      await this.updateMintingStatus(
        mintRequestId, 
        'FAILED', 
        executorAddress, 
        `Unexpected error: ${error.message}`
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure the token exists on blockchain (create if needed)
   */
  private async ensureTokenExists(mintRequest: any): Promise<{ success: boolean; error?: string }> {
    try {
      const chainId = mintRequest.project?.chainId || env.DEFAULT_CHAIN_ID;
      
      // Check if token already exists by trying to get its info
      try {
        const tokenInfo = await blockchainService.getLiftTokenInfo(mintRequest.tokenId, chainId);
        
        // If maxSupply is 0, the token doesn't exist yet
        if (tokenInfo.maxSupply === '0') {
          this.app.log.info({ tokenId: mintRequest.tokenId }, 'Token does not exist, creating...');
          
          // Create the token on blockchain
          const createTxHash = await blockchainService.createLiftToken(
            mintRequest.tokenId,
            '1000000', // Max supply (1M tokens) - make this configurable
            `${env.API_BASE_URL}/api/lift-tokens/${mintRequest.tokenId}/metadata`,
            chainId
          );

          // Wait for creation to be confirmed
          await blockchainService.waitForTransaction(createTxHash, chainId);
          
          this.app.log.info({ 
            tokenId: mintRequest.tokenId, 
            createTxHash 
          }, 'Token created successfully');
        }

        return { success: true };
        
      } catch (tokenError) {
        // If we can't get token info, it probably doesn't exist, so create it
        this.app.log.info({ tokenId: mintRequest.tokenId }, 'Creating new token...');
        
        const createTxHash = await blockchainService.createLiftToken(
          mintRequest.tokenId,
          '1000000', // Max supply 
          `${env.API_BASE_URL}/api/lift-tokens/${mintRequest.tokenId}/metadata`,
          chainId
        );

        await blockchainService.waitForTransaction(createTxHash, chainId);
        return { success: true };
      }

    } catch (error) {
      this.app.log.error({ error, tokenId: mintRequest.tokenId }, 'Failed to ensure token exists');
      return { 
        success: false, 
        error: `Token creation failed: ${error.message}` 
      };
    }
  }

  /**
   * Mint the tokens on blockchain
   */
  private async mintTokens(mintRequest: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const chainId = mintRequest.project?.chainId || env.DEFAULT_CHAIN_ID;
      
      const txHash = await blockchainService.mintLiftToken(
        mintRequest.recipient,
        mintRequest.tokenId,
        mintRequest.amount,
        chainId
      );

      return {
        success: true,
        txHash
      };

    } catch (error) {
      this.app.log.error({ error, mintRequest }, 'Token minting failed');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or update LiftToken database record
   */
  private async createLiftTokenRecord(mintRequest: any, txHash: string, receipt: any) {
    try {
      // Check if LiftToken already exists for this mint request
      let liftToken = await this.app.prisma.liftToken.findFirst({
        where: { mintRequestId: mintRequest.id }
      });

      if (!liftToken) {
        // Create new LiftToken record
        liftToken = await this.app.prisma.liftToken.create({
          data: {
            tokenId: mintRequest.tokenId,
            contractAddress: env.LIFT_TOKENS_ADDRESS,
            chainId: mintRequest.project?.chainId || env.DEFAULT_CHAIN_ID,
            mintRequestId: mintRequest.id,
            projectId: mintRequest.projectId,
            status: 'ISSUED',
            quantity: mintRequest.amount,
            unit: 'LU',
            meta: {
              title: mintRequest.title,
              description: mintRequest.description,
              verificationData: mintRequest.verificationData,
              verificationHash: mintRequest.verificationHash,
              mintedAt: new Date().toISOString(),
              txHash
            },
            issuedAt: new Date()
          }
        });
      } else {
        // Update existing LiftToken
        liftToken = await this.app.prisma.liftToken.update({
          where: { id: liftToken.id },
          data: {
            status: 'ISSUED',
            issuedAt: new Date()
          }
        });
      }

      // Create LiftToken event
      await this.app.prisma.liftTokenEvent.create({
        data: {
          liftTokenId: liftToken.id,
          type: 'ISSUED',
          txHash,
          blockNumber: Number(receipt.blockNumber),
          payload: {
            mintRequestId: mintRequest.id,
            tokenId: mintRequest.tokenId,
            amount: mintRequest.amount,
            recipient: mintRequest.recipient
          },
          eventAt: new Date()
        }
      });

      this.app.log.info({
        liftTokenId: liftToken.id,
        mintRequestId: mintRequest.id,
        tokenId: mintRequest.tokenId
      }, 'LiftToken record created/updated');

    } catch (error) {
      this.app.log.error({ error, mintRequestId: mintRequest.id }, 'Failed to create LiftToken record');
      // Don't throw here - the blockchain mint succeeded, this is just database housekeeping
    }
  }

  /**
   * Update minting status and create event
   */
  private async updateMintingStatus(
    mintRequestId: string, 
    status: string, 
    performedBy: string, 
    notes: string
  ) {
    // Update mint request status
    await this.app.prisma.mintRequest.update({
      where: { id: mintRequestId },
      data: { 
        status: status as any,
        ...(status === 'MINTING' && { executedAt: new Date() })
      }
    });

    // Create event
    await this.app.prisma.mintRequestEvent.create({
      data: {
        mintRequestId,
        type: status === 'MINTING' ? 'MINT_STARTED' : 'MINT_FAILED',
        performedBy,
        notes,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Execute minting for all approved requests (batch processing)
   */
  async processApprovedRequests(executorAddress: string, limit: number = 10): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ id: string; success: boolean; txHash?: string; error?: string }>;
  }> {
    // Get approved requests ready for minting
    const approvedRequests = await this.app.prisma.mintRequest.findMany({
      where: { status: 'APPROVED' },
      include: { project: true },
      take: limit,
      orderBy: { createdAt: 'asc' } // Process oldest first
    });

    this.app.log.info({ 
      count: approvedRequests.length,
      executorAddress 
    }, 'Processing approved mint requests');

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const request of approvedRequests) {
      try {
        const result = await this.executeMinting(request.id, executorAddress);
        results.push({
          id: request.id,
          success: result.success,
          txHash: result.txHash,
          error: result.error
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Add delay between mints to avoid overwhelming the blockchain
        if (approvedRequests.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

      } catch (error) {
        this.app.log.error({ error, mintRequestId: request.id }, 'Failed to process mint request');
        results.push({
          id: request.id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    return {
      processed: approvedRequests.length,
      successful,
      failed,
      results
    };
  }
}