import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, Address, Hex } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../../utils/logger';

export interface USDCTransferRequest {
  recipientAddress: Address;
  amount: bigint; // Amount in USDC (6 decimals)
  chainId: number;
  reference: string;
  memo?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface USDCTransferResponse {
  transactionHash: Hex;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  chainId: number;
  blockNumber?: bigint;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  confirmations: number;
  reference: string;
  error?: string;
}

export interface USDCStatus {
  transactionHash: Hex;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  chainId: number;
  amount: bigint;
  recipientAddress: Address;
  blockNumber?: bigint;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  confirmations: number;
  timestamp?: bigint;
  lastChecked: Date;
}

export interface USDCBatch {
  batchId: string;
  transfers: USDCTransferRequest[];
  chainId: number;
  totalAmount: bigint;
  gasSettings?: {
    gasLimit: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
}

export interface USDCBatchResponse {
  batchId: string;
  transactions: {
    reference: string;
    transactionHash: Hex;
    status: string;
  }[];
  totalAmount: bigint;
  successCount: number;
  failedCount: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
}

export interface USDCBalance {
  chainId: number;
  balance: bigint;
  formattedBalance: string;
  address: Address;
  lastUpdated: Date;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  usdcAddress: Address;
  rpcUrl: string;
  explorerUrl: string;
  confirmationsRequired: number;
}

// USDC contract addresses on different chains
const USDC_ADDRESSES: Record<number, Address> = {
  1: '0xA0b86a33E6417c0C6BFF08c3f67a5D1A0BA99fC4', // Ethereum Mainnet
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum One
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
};

// Chain configurations
const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    usdcAddress: USDC_ADDRESSES[1],
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
    explorerUrl: 'https://etherscan.io',
    confirmationsRequired: 12,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    usdcAddress: USDC_ADDRESSES[137],
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    confirmationsRequired: 20,
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    usdcAddress: USDC_ADDRESSES[42161],
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    confirmationsRequired: 1,
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    usdcAddress: USDC_ADDRESSES[8453],
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    confirmationsRequired: 1,
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    usdcAddress: USDC_ADDRESSES[10],
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    confirmationsRequired: 1,
  },
};

// USDC ERC-20 ABI (minimal interface)
const USDC_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * USDC Payment Provider
 * 
 * This service handles USDC token transfers across multiple EVM chains.
 * Supports Ethereum, Polygon, Arbitrum, Base, and Optimism networks.
 */
export class USDCProvider {
  private privateKey: Hex;
  private supportedChains: ChainConfig[];

  constructor(config: {
    privateKey: Hex;
    supportedChains?: number[];
  }) {
    this.privateKey = config.privateKey;
    this.supportedChains = (config.supportedChains || [1, 137, 42161, 8453, 10])
      .map(chainId => CHAIN_CONFIGS[chainId])
      .filter(Boolean);

    if (this.supportedChains.length === 0) {
      throw new Error('No supported chains configured');
    }

    logger.info('USDC Provider initialized', {
      supportedChains: this.supportedChains.map(c => c.name),
    });
  }

  /**
   * Submit a USDC transfer
   */
  async submitTransfer(request: USDCTransferRequest): Promise<USDCTransferResponse> {
    try {
      logger.info('Submitting USDC transfer', {
        recipient: request.recipientAddress,
        amount: formatUnits(request.amount, 6),
        chainId: request.chainId,
        reference: request.reference,
      });

      // Validate transfer request
      this.validateTransferRequest(request);

      const chainConfig = this.getChainConfig(request.chainId);
      const account = privateKeyToAccount(this.privateKey);

      // Create clients
      const publicClient = createPublicClient({
        chain: this.getViemChain(request.chainId),
        transport: http(chainConfig.rpcUrl),
      });

      const walletClient = createWalletClient({
        account,
        chain: this.getViemChain(request.chainId),
        transport: http(chainConfig.rpcUrl),
      });

      // Check balance
      const balance = await this.getBalance(request.chainId, account.address);
      if (balance.balance < request.amount) {
        throw new Error(
          `Insufficient USDC balance. Required: ${formatUnits(request.amount, 6)}, Available: ${balance.formattedBalance}`
        );
      }

      // Estimate gas
      const gasEstimate = await publicClient.estimateContractGas({
        address: chainConfig.usdcAddress,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [request.recipientAddress, request.amount],
        account: account.address,
      });

      // Execute transfer
      const transactionHash = await walletClient.writeContract({
        address: chainConfig.usdcAddress,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [request.recipientAddress, request.amount],
        gas: request.gasLimit || gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
        maxFeePerGas: request.maxFeePerGas,
        maxPriorityFeePerGas: request.maxPriorityFeePerGas,
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: 1,
      });

      const response: USDCTransferResponse = {
        transactionHash,
        status: receipt.status === 'success' ? 'CONFIRMED' : 'FAILED',
        chainId: request.chainId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        confirmations: 1,
        reference: request.reference,
      };

      if (receipt.status !== 'success') {
        response.error = 'Transaction failed on-chain';
      }

      logger.info('USDC transfer completed', {
        transactionHash,
        status: response.status,
        gasUsed: receipt.gasUsed.toString(),
        reference: request.reference,
      });

      return response;
    } catch (error) {
      logger.error('Failed to submit USDC transfer', {
        error: error.message,
        reference: request.reference,
        chainId: request.chainId,
      });

      return {
        transactionHash: '0x' as Hex,
        status: 'FAILED',
        chainId: request.chainId,
        confirmations: 0,
        reference: request.reference,
        error: error.message,
      };
    }
  }

  /**
   * Submit a batch of USDC transfers
   */
  async submitBatch(batch: USDCBatch): Promise<USDCBatchResponse> {
    try {
      logger.info('Submitting USDC batch', {
        batchId: batch.batchId,
        transferCount: batch.transfers.length,
        totalAmount: formatUnits(batch.totalAmount, 6),
        chainId: batch.chainId,
      });

      const results = [];
      let successCount = 0;
      let failedCount = 0;

      // Process transfers sequentially to avoid nonce conflicts
      for (const transfer of batch.transfers) {
        try {
          const result = await this.submitTransfer({
            ...transfer,
            chainId: batch.chainId,
            gasLimit: batch.gasSettings?.gasLimit,
            maxFeePerGas: batch.gasSettings?.maxFeePerGas,
            maxPriorityFeePerGas: batch.gasSettings?.maxPriorityFeePerGas,
          });

          results.push({
            reference: transfer.reference,
            transactionHash: result.transactionHash,
            status: result.status,
          });

          if (result.status === 'CONFIRMED') {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          logger.error('Batch transfer failed', {
            reference: transfer.reference,
            error: error.message,
          });

          results.push({
            reference: transfer.reference,
            transactionHash: '0x' as Hex,
            status: 'FAILED',
          });
          failedCount++;
        }
      }

      const batchResponse: USDCBatchResponse = {
        batchId: batch.batchId,
        transactions: results,
        totalAmount: batch.totalAmount,
        successCount,
        failedCount,
        status: successCount === batch.transfers.length ? 'COMPLETED' :
                failedCount === batch.transfers.length ? 'FAILED' : 'PARTIAL',
      };

      logger.info('USDC batch completed', {
        batchId: batch.batchId,
        successCount,
        failedCount,
        status: batchResponse.status,
      });

      return batchResponse;
    } catch (error) {
      logger.error('Failed to submit USDC batch', {
        error: error.message,
        batchId: batch.batchId,
      });
      throw error;
    }
  }

  /**
   * Get the status of a USDC transfer
   */
  async getTransferStatus(transactionHash: Hex, chainId: number): Promise<USDCStatus> {
    try {
      logger.info('Checking USDC transfer status', { transactionHash, chainId });

      const chainConfig = this.getChainConfig(chainId);
      const publicClient = createPublicClient({
        chain: this.getViemChain(chainId),
        transport: http(chainConfig.rpcUrl),
      });

      // Get transaction receipt
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash,
      });

      // Get transaction details
      const transaction = await publicClient.getTransaction({
        hash: transactionHash,
      });

      // Get current block number for confirmations
      const currentBlock = await publicClient.getBlockNumber();
      const confirmations = receipt.blockNumber ? 
        Number(currentBlock - receipt.blockNumber) + 1 : 0;

      // Extract transfer details from transaction data
      const { recipientAddress, amount } = this.parseTransferData(transaction.input);

      const status: USDCStatus = {
        transactionHash,
        status: receipt.status === 'success' ? 
          (confirmations >= chainConfig.confirmationsRequired ? 'CONFIRMED' : 'PENDING') : 
          'FAILED',
        chainId,
        amount,
        recipientAddress,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        confirmations,
        timestamp: await this.getBlockTimestamp(publicClient, receipt.blockNumber),
        lastChecked: new Date(),
      };

      logger.info('USDC status retrieved', {
        transactionHash,
        status: status.status,
        confirmations,
      });

      return status;
    } catch (error) {
      logger.error('Failed to get USDC transfer status', {
        error: error.message,
        transactionHash,
        chainId,
      });
      throw error;
    }
  }

  /**
   * Get USDC balance for an address
   */
  async getBalance(chainId: number, address: Address): Promise<USDCBalance> {
    try {
      const chainConfig = this.getChainConfig(chainId);
      const publicClient = createPublicClient({
        chain: this.getViemChain(chainId),
        transport: http(chainConfig.rpcUrl),
      });

      const balance = await publicClient.readContract({
        address: chainConfig.usdcAddress,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      return {
        chainId,
        balance,
        formattedBalance: formatUnits(balance, 6),
        address,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get USDC balance', {
        error: error.message,
        chainId,
        address,
      });
      throw error;
    }
  }

  /**
   * Get current gas prices for a chain
   */
  async getGasPrices(chainId: number): Promise<{
    slow: bigint;
    standard: bigint;
    fast: bigint;
  }> {
    try {
      const chainConfig = this.getChainConfig(chainId);
      const publicClient = createPublicClient({
        chain: this.getViemChain(chainId),
        transport: http(chainConfig.rpcUrl),
      });

      const feeHistory = await publicClient.getFeeHistory({
        blockCount: 4,
        rewardPercentiles: [25, 50, 75],
      });

      const baseFee = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
      const priorityFees = feeHistory.reward[feeHistory.reward.length - 1];

      return {
        slow: baseFee + priorityFees[0],
        standard: baseFee + priorityFees[1],
        fast: baseFee + priorityFees[2],
      };
    } catch (error) {
      logger.error('Failed to get gas prices', {
        error: error.message,
        chainId,
      });
      throw error;
    }
  }

  /**
   * Estimate gas for a USDC transfer
   */
  async estimateGas(request: USDCTransferRequest): Promise<bigint> {
    try {
      const chainConfig = this.getChainConfig(request.chainId);
      const account = privateKeyToAccount(this.privateKey);
      
      const publicClient = createPublicClient({
        chain: this.getViemChain(request.chainId),
        transport: http(chainConfig.rpcUrl),
      });

      const gasEstimate = await publicClient.estimateContractGas({
        address: chainConfig.usdcAddress,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [request.recipientAddress, request.amount],
        account: account.address,
      });

      return gasEstimate;
    } catch (error) {
      logger.error('Failed to estimate gas', {
        error: error.message,
        chainId: request.chainId,
      });
      throw error;
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return this.supportedChains;
  }

  /**
   * Get USDC contract address for a chain
   */
  getUSDCAddress(chainId: number): Address {
    const config = this.getChainConfig(chainId);
    return config.usdcAddress;
  }

  // Private helper methods

  private validateTransferRequest(request: USDCTransferRequest): void {
    if (!request.recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(request.recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (request.amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }

    if (!this.isChainSupported(request.chainId)) {
      throw new Error(`Chain ${request.chainId} is not supported`);
    }

    if (!request.reference || request.reference.trim().length === 0) {
      throw new Error('Reference is required');
    }
  }

  private getChainConfig(chainId: number): ChainConfig {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    return config;
  }

  private isChainSupported(chainId: number): boolean {
    return this.supportedChains.some(chain => chain.chainId === chainId);
  }

  private getViemChain(chainId: number) {
    switch (chainId) {
      case 1: return mainnet;
      case 137: return polygon;
      case 42161: return arbitrum;
      case 8453: return base;
      case 10: return optimism;
      default: throw new Error(`Unsupported chain: ${chainId}`);
    }
  }

  private parseTransferData(data: Hex): { recipientAddress: Address; amount: bigint } {
    // Simple parsing of transfer function call data
    // In production, you'd use a proper ABI decoder
    if (data.length < 138) { // 4 bytes selector + 32 bytes address + 32 bytes amount
      throw new Error('Invalid transfer data');
    }

    const recipientAddress = ('0x' + data.slice(34, 74)) as Address;
    const amount = BigInt('0x' + data.slice(74, 138));

    return { recipientAddress, amount };
  }

  private async getBlockTimestamp(publicClient: any, blockNumber: bigint): Promise<bigint> {
    try {
      const block = await publicClient.getBlock({ blockNumber });
      return block.timestamp;
    } catch (error) {
      return BigInt(Math.floor(Date.now() / 1000));
    }
  }
}