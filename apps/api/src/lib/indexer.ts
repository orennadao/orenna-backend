import { FastifyInstance } from 'fastify';
import { Address, Hash, parseAbi, getContract, Log, decodeEventLog } from 'viem';
import { blockchainService } from './blockchain.js';
import { REPAYMENT_ESCROW_ABI, ALLOCATION_ESCROW_ABI } from './payment.js';

interface IndexerConfig {
  chainId: number;
  contractAddress: Address;
  indexerType: 'RepaymentEscrow' | 'AllocationEscrow' | 'LiftUnits';
  startBlock?: number;
  confirmations?: number;
  batchSize?: number;
}

interface EventProcessingResult {
  processed: number;
  failed: number;
  lastBlock: number;
  errors: string[];
}

export class BlockchainIndexer {
  private isRunning = false;
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  constructor(private app: FastifyInstance) {}

  async startIndexing(configs: IndexerConfig[]): Promise<void> {
    if (this.isRunning) {
      this.app.log.warn('Indexer already running');
      return;
    }

    this.isRunning = true;
    this.app.log.info({ configs }, 'Starting blockchain indexing');

    for (const config of configs) {
      await this.initializeIndexerState(config);
      this.startIndexerLoop(config);
    }
  }

  async stopIndexing(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear all interval timers
    for (const [key, intervalId] of this.intervalIds) {
      clearInterval(intervalId);
      this.intervalIds.delete(key);
    }

    this.app.log.info('Blockchain indexing stopped');
  }

  private async initializeIndexerState(config: IndexerConfig): Promise<void> {
    const key = this.getIndexerKey(config);
    
    const existing = await this.app.prisma.indexerState.findUnique({
      where: {
        chainId_contractAddress_indexerType: {
          chainId: config.chainId,
          contractAddress: config.contractAddress.toLowerCase(),
          indexerType: config.indexerType
        }
      }
    });

    if (!existing) {
      await this.app.prisma.indexerState.create({
        data: {
          chainId: config.chainId,
          contractAddress: config.contractAddress.toLowerCase(),
          indexerType: config.indexerType,
          startBlock: config.startBlock || 0,
          confirmations: config.confirmations || 12,
          isActive: true
        }
      });

      this.app.log.info({ config }, 'Initialized indexer state');
    }
  }

  private startIndexerLoop(config: IndexerConfig): void {
    const key = this.getIndexerKey(config);
    const intervalMs = 30000; // 30 seconds

    const intervalId = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(intervalId);
        this.intervalIds.delete(key);
        return;
      }

      try {
        await this.processEvents(config);
      } catch (error) {
        this.app.log.error({ error, config }, 'Error in indexer loop');
        await this.recordIndexerError(config, error.message);
      }
    }, intervalMs);

    this.intervalIds.set(key, intervalId);
    this.app.log.info({ config, intervalMs }, 'Started indexer loop');
  }

  private async processEvents(config: IndexerConfig): Promise<EventProcessingResult> {
    const state = await this.getIndexerState(config);
    if (!state || !state.isActive) {
      return { processed: 0, failed: 0, lastBlock: 0, errors: [] };
    }

    const publicClient = blockchainService.getPublicClient(config.chainId);
    const currentBlock = await publicClient.getBlockNumber();
    const confirmedBlock = currentBlock - BigInt(state.confirmations);

    if (BigInt(state.lastBlockNumber) >= confirmedBlock) {
      // No new confirmed blocks to process
      return { processed: 0, failed: 0, lastBlock: Number(confirmedBlock), errors: [] };
    }

    const fromBlock = BigInt(Math.max(state.lastBlockNumber + 1, state.startBlock));
    const toBlock = BigInt(Math.min(
      Number(fromBlock) + (config.batchSize || 1000),
      Number(confirmedBlock)
    ));

    this.app.log.debug({
      config: config.indexerType,
      chainId: config.chainId,
      fromBlock: Number(fromBlock),
      toBlock: Number(toBlock),
      confirmedBlock: Number(confirmedBlock)
    }, 'Processing events');

    const events = await this.fetchContractEvents(config, fromBlock, toBlock);
    const result = await this.processEventBatch(config, events);

    // Update indexer state
    await this.updateIndexerState(config, Number(toBlock));

    return {
      ...result,
      lastBlock: Number(toBlock)
    };
  }

  private async fetchContractEvents(
    config: IndexerConfig,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<Log[]> {
    const publicClient = blockchainService.getPublicClient(config.chainId);

    const events = await publicClient.getLogs({
      address: config.contractAddress,
      fromBlock,
      toBlock
    });

    return events;
  }

  private async processEventBatch(
    config: IndexerConfig,
    events: Log[]
  ): Promise<{ processed: number; failed: number; errors: string[] }> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        await this.processSingleEvent(config, event);
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Event ${event.transactionHash}:${event.logIndex} - ${error.message}`);
        this.app.log.error({ 
          error, 
          event: {
            txHash: event.transactionHash,
            logIndex: event.logIndex,
            blockNumber: event.blockNumber
          }
        }, 'Failed to process event');
      }
    }

    if (events.length > 0) {
      this.app.log.info({
        indexerType: config.indexerType,
        chainId: config.chainId,
        processed,
        failed,
        total: events.length
      }, 'Processed event batch');
    }

    return { processed, failed, errors };
  }

  private async processSingleEvent(config: IndexerConfig, event: Log): Promise<void> {
    // Check if event already exists
    const existing = await this.app.prisma.indexedEvent.findUnique({
      where: {
        chainId_txHash_logIndex: {
          chainId: config.chainId,
          txHash: event.transactionHash!,
          logIndex: event.logIndex!
        }
      }
    });

    if (existing) {
      return; // Skip already processed events
    }

    // Get block details for timestamp
    const publicClient = blockchainService.getPublicClient(config.chainId);
    const block = await publicClient.getBlock({ 
      blockHash: event.blockHash!,
      includeTransactions: false 
    });

    // Decode the event based on contract type
    const decodedEvent = this.decodeEvent(config, event);

    // Store the indexed event
    const indexedEvent = await this.app.prisma.indexedEvent.create({
      data: {
        chainId: config.chainId,
        contractAddress: config.contractAddress.toLowerCase(),
        eventName: decodedEvent?.eventName || 'Unknown',
        eventSignature: event.topics[0]!,
        blockNumber: Number(event.blockNumber!),
        blockHash: event.blockHash!,
        blockTimestamp: new Date(Number(block.timestamp) * 1000),
        txHash: event.transactionHash!,
        txIndex: event.transactionIndex!,
        logIndex: event.logIndex!,
        topics: event.topics,
        data: event.data,
        decodedArgs: decodedEvent?.args || {},
        processed: false
      }
    });

    // Process the event for business logic
    await this.handleEventBusinessLogic(config, decodedEvent, indexedEvent.id);
  }

  private decodeEvent(config: IndexerConfig, event: Log): { eventName: string; args: any } | null {
    try {
      let abi: any;

      switch (config.indexerType) {
        case 'RepaymentEscrow':
          abi = REPAYMENT_ESCROW_ABI;
          break;
        case 'AllocationEscrow':
          abi = ALLOCATION_ESCROW_ABI;
          break;
        default:
          return null;
      }

      const decoded = decodeEventLog({
        abi,
        data: event.data,
        topics: event.topics
      });

      return {
        eventName: decoded.eventName,
        args: decoded.args
      };
    } catch (error) {
      this.app.log.warn({ 
        error: error.message, 
        event: event.topics[0] 
      }, 'Failed to decode event');
      return null;
    }
  }

  private async handleEventBusinessLogic(
    config: IndexerConfig,
    decodedEvent: { eventName: string; args: any } | null,
    indexedEventId: string
  ): Promise<void> {
    if (!decodedEvent) {
      return;
    }

    try {
      switch (config.indexerType) {
        case 'RepaymentEscrow':
          await this.handleRepaymentEscrowEvent(decodedEvent, indexedEventId);
          break;
        case 'AllocationEscrow':
          await this.handleAllocationEscrowEvent(decodedEvent, indexedEventId);
          break;
      }

      // Mark event as processed
      await this.app.prisma.indexedEvent.update({
        where: { id: indexedEventId },
        data: { 
          processed: true, 
          processedAt: new Date() 
        }
      });

    } catch (error) {
      // Record processing error
      await this.app.prisma.indexedEvent.update({
        where: { id: indexedEventId },
        data: { 
          processingError: error.message,
          retryCount: { increment: 1 }
        }
      });
      
      throw error;
    }
  }

  private async handleRepaymentEscrowEvent(
    event: { eventName: string; args: any },
    indexedEventId: string
  ): Promise<void> {
    switch (event.eventName) {
      case 'ProceedsReceived':
        await this.handleProceedsReceived(event.args, indexedEventId);
        break;
      case 'PaidFunder':
        await this.handlePaidFunder(event.args, indexedEventId);
        break;
      case 'PaidPlatform':
        await this.handlePaidPlatform(event.args, indexedEventId);
        break;
      case 'PaidSteward':
        await this.handlePaidSteward(event.args, indexedEventId);
        break;
    }
  }

  private async handleAllocationEscrowEvent(
    event: { eventName: string; args: any },
    indexedEventId: string
  ): Promise<void> {
    switch (event.eventName) {
      case 'UnitsSold':
        await this.handleUnitsSold(event.args, indexedEventId);
        break;
      case 'MarketWindowOpened':
        await this.handleMarketWindowOpened(event.args, indexedEventId);
        break;
      case 'MarketWindowExtended':
        await this.handleMarketWindowExtended(event.args, indexedEventId);
        break;
    }
  }

  private async handleProceedsReceived(args: any, indexedEventId: string): Promise<void> {
    const { projectId, amount, considerationRef } = args;

    // Find related payment by consideration ref
    const considerationRefStr = considerationRef.toString();
    const payment = await this.app.prisma.payment.findFirst({
      where: {
        projectId: Number(projectId),
        metadata: {
          path: ['considerationRef'],
          equals: considerationRefStr
        }
      }
    });

    if (payment) {
      // Update payment status
      await this.app.prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'IN_ESCROW',
          proceedsNotified: true
        }
      });

      // Create payment event
      await this.app.prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'PROCEEDS_NOTIFIED',
          amount: amount.toString(),
          metadata: { 
            indexedEventId, 
            considerationRef: considerationRefStr 
          }
        }
      });
    }
  }

  private async handlePaidFunder(args: any, indexedEventId: string): Promise<void> {
    const { projectId, amount } = args;

    // Create a payment event for funder payment
    // This might be linked to an existing payment or be standalone
    this.app.log.info({ 
      projectId: Number(projectId), 
      amount: amount.toString() 
    }, 'Funder payment processed');
  }

  private async handlePaidPlatform(args: any, indexedEventId: string): Promise<void> {
    const { projectId, amount } = args;

    // Create a payment event for platform fee
    this.app.log.info({ 
      projectId: Number(projectId), 
      amount: amount.toString() 
    }, 'Platform fee processed');
  }

  private async handlePaidSteward(args: any, indexedEventId: string): Promise<void> {
    const { projectId, amount } = args;

    // Create a payment event for steward payment
    this.app.log.info({ 
      projectId: Number(projectId), 
      amount: amount.toString() 
    }, 'Steward payment processed');
  }

  private async handleUnitsSold(args: any, indexedEventId: string): Promise<void> {
    const { projectId, beneficiary, tokenIds, amounts, considerationRef, proceeds } = args;

    // Find or create payment record for this sale
    const considerationRefStr = considerationRef.toString();
    let payment = await this.app.prisma.payment.findFirst({
      where: {
        projectId: Number(projectId),
        metadata: {
          path: ['considerationRef'],
          equals: considerationRefStr
        }
      }
    });

    if (!payment) {
      // Create payment record if it doesn't exist
      payment = await this.app.prisma.payment.create({
        data: {
          paymentType: 'LIFT_UNIT_PURCHASE',
          projectId: Number(projectId),
          amount: proceeds.toString(),
          paymentToken: '0x0000000000000000000000000000000000000000', // ETH
          chainId: 1, // This should be dynamic based on indexer config
          payerAddress: beneficiary.toLowerCase(),
          recipientAddress: beneficiary.toLowerCase(),
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          metadata: {
            considerationRef: considerationRefStr,
            tokenIds: tokenIds.map((id: any) => id.toString()),
            amounts: amounts.map((amt: any) => amt.toString()),
            createdFromEvent: true
          }
        }
      });
    }

    // Update lift units with purchase information
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i].toString();
      const amount = amounts[i].toString();

      // Try to find existing lift unit or create one
      await this.app.prisma.liftUnit.upsert({
        where: { tokenId },
        update: {
          status: 'SOLD',
          meta: {
            ...((await this.app.prisma.liftUnit.findUnique({ 
              where: { tokenId }, 
              select: { meta: true } 
            }))?.meta || {}),
            soldAmount: amount,
            soldTo: beneficiary.toLowerCase(),
            soldAt: new Date().toISOString()
          }
        },
        create: {
          tokenId,
          projectId: Number(projectId),
          status: 'SOLD',
          quantity: amount,
          meta: {
            soldAmount: amount,
            soldTo: beneficiary.toLowerCase(),
            soldAt: new Date().toISOString(),
            createdFromSale: true
          }
        }
      });
    }

    this.app.log.info({
      projectId: Number(projectId),
      beneficiary,
      tokenCount: tokenIds.length,
      proceeds: proceeds.toString()
    }, 'Units sold event processed');
  }

  private async handleMarketWindowOpened(args: any, indexedEventId: string): Promise<void> {
    const { projectId, closesAt } = args;
    
    this.app.log.info({ 
      projectId: Number(projectId), 
      closesAt: Number(closesAt) 
    }, 'Market window opened');
  }

  private async handleMarketWindowExtended(args: any, indexedEventId: string): Promise<void> {
    const { projectId, newClosesAt } = args;
    
    this.app.log.info({ 
      projectId: Number(projectId), 
      newClosesAt: Number(newClosesAt) 
    }, 'Market window extended');
  }

  private async getIndexerState(config: IndexerConfig) {
    return await this.app.prisma.indexerState.findUnique({
      where: {
        chainId_contractAddress_indexerType: {
          chainId: config.chainId,
          contractAddress: config.contractAddress.toLowerCase(),
          indexerType: config.indexerType
        }
      }
    });
  }

  private async updateIndexerState(config: IndexerConfig, lastBlockNumber: number): Promise<void> {
    await this.app.prisma.indexerState.update({
      where: {
        chainId_contractAddress_indexerType: {
          chainId: config.chainId,
          contractAddress: config.contractAddress.toLowerCase(),
          indexerType: config.indexerType
        }
      },
      data: {
        lastBlockNumber,
        lastSyncAt: new Date(),
        errorCount: 0, // Reset error count on successful update
        lastError: null,
        lastErrorAt: null
      }
    });
  }

  private async recordIndexerError(config: IndexerConfig, error: string): Promise<void> {
    await this.app.prisma.indexerState.updateMany({
      where: {
        chainId: config.chainId,
        contractAddress: config.contractAddress.toLowerCase(),
        indexerType: config.indexerType
      },
      data: {
        errorCount: { increment: 1 },
        lastError: error,
        lastErrorAt: new Date()
      }
    });
  }

  private getIndexerKey(config: IndexerConfig): string {
    return `${config.chainId}:${config.contractAddress}:${config.indexerType}`;
  }

  // Public methods for managing indexers
  async getIndexerStatus() {
    const states = await this.app.prisma.indexerState.findMany({
      orderBy: [
        { chainId: 'asc' },
        { indexerType: 'asc' }
      ]
    });

    return {
      isRunning: this.isRunning,
      activeIndexers: this.intervalIds.size,
      states
    };
  }

  async retryFailedEvents(limit: number = 100): Promise<{ processed: number; failed: number }> {
    const failedEvents = await this.app.prisma.indexedEvent.findMany({
      where: {
        processed: false,
        processingError: { not: null },
        retryCount: { lt: 3 }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    let processed = 0;
    let failed = 0;

    for (const event of failedEvents) {
      try {
        const config: IndexerConfig = {
          chainId: event.chainId,
          contractAddress: event.contractAddress as Address,
          indexerType: event.contractAddress.includes('repayment') ? 'RepaymentEscrow' : 'AllocationEscrow'
        };

        const decodedEvent = {
          eventName: event.eventName,
          args: event.decodedArgs
        };

        await this.handleEventBusinessLogic(config, decodedEvent, event.id);
        processed++;
      } catch (error) {
        failed++;
        await this.app.prisma.indexedEvent.update({
          where: { id: event.id },
          data: {
            processingError: error.message,
            retryCount: { increment: 1 }
          }
        });
      }
    }

    return { processed, failed };
  }
}