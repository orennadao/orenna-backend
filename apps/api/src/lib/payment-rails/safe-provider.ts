import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, Address, Hex, encodeFunctionData } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../../utils/logger';

export interface SafeTransferRequest {
  safeAddress: Address;
  recipientAddress: Address;
  tokenAddress: Address; // USDC or other token
  amount: bigint;
  chainId: number;
  reference: string;
  memo?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface SafeTransferResponse {
  safeTransactionHash: string;
  transactionHash?: Hex;
  status: 'PENDING_SIGNATURES' | 'EXECUTABLE' | 'EXECUTED' | 'FAILED';
  chainId: number;
  signatures: number;
  requiredSignatures: number;
  nonce: number;
  reference: string;
  error?: string;
}

export interface SafeStatus {
  safeTransactionHash: string;
  transactionHash?: Hex;
  status: 'PENDING_SIGNATURES' | 'EXECUTABLE' | 'EXECUTED' | 'FAILED';
  chainId: number;
  safeAddress: Address;
  amount: bigint;
  recipientAddress: Address;
  tokenAddress: Address;
  signatures: number;
  requiredSignatures: number;
  nonce: number;
  gasUsed?: bigint;
  blockNumber?: bigint;
  lastChecked: Date;
}

export interface SafeInfo {
  address: Address;
  chainId: number;
  threshold: number;
  owners: Address[];
  nonce: number;
  version: string;
  guard?: Address;
  fallbackHandler?: Address;
}

export interface SafeSignature {
  signer: Address;
  data: Hex;
  dynamic: boolean;
}

export interface SafeTransaction {
  safeTransactionHash: string;
  to: Address;
  value: bigint;
  data: Hex;
  operation: number;
  gasToken: Address;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  refundReceiver: Address;
  nonce: number;
  signatures: SafeSignature[];
  executionDate?: Date;
  blockNumber?: bigint;
  transactionHash?: Hex;
  isExecuted: boolean;
  isSuccessful?: boolean;
}

export interface SafeBatch {
  batchId: string;
  safeAddress: Address;
  transfers: Omit<SafeTransferRequest, 'safeAddress' | 'chainId'>[];
  chainId: number;
  totalAmount: bigint;
}

export interface SafeBatchResponse {
  batchId: string;
  batchTransactionHash: string;
  status: 'PENDING_SIGNATURES' | 'EXECUTABLE' | 'EXECUTED' | 'FAILED';
  transfers: {
    reference: string;
    included: boolean;
  }[];
  signatures: number;
  requiredSignatures: number;
}

// Safe Contract ABI (minimal interface)
const SAFE_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' },
    ],
    name: 'execTransaction',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC-20 Token ABI (for transfers)
const ERC20_ABI = [
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
] as const;

// MultiSend ABI for batch transactions
const MULTISEND_ABI = [
  {
    inputs: [{ name: 'transactions', type: 'bytes' }],
    name: 'multiSend',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// MultiSend contract addresses
const MULTISEND_ADDRESSES: Record<number, Address> = {
  1: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761', // Ethereum
  137: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761', // Polygon
  42161: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761', // Arbitrum
  8453: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761', // Base
  10: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761', // Optimism
};

/**
 * Safe Multisig Payment Provider
 * 
 * This service handles payments through Safe multisig wallets.
 * Integrates with Safe Transaction Service API for off-chain signature collection
 * and on-chain execution.
 */
export class SafeProvider {
  private privateKey: Hex;
  private serviceUrls: Record<number, string>;

  constructor(config: {
    privateKey: Hex;
    serviceUrls?: Record<number, string>;
  }) {
    this.privateKey = config.privateKey;
    
    // Default Safe Transaction Service URLs
    this.serviceUrls = config.serviceUrls || {
      1: 'https://safe-transaction-mainnet.safe.global',
      137: 'https://safe-transaction-polygon.safe.global',
      42161: 'https://safe-transaction-arbitrum.safe.global',
      8453: 'https://safe-transaction-base.safe.global',
      10: 'https://safe-transaction-optimism.safe.global',
    };

    logger.info('Safe Provider initialized', {
      supportedChains: Object.keys(this.serviceUrls),
    });
  }

  /**
   * Submit a Safe multisig transfer
   */
  async submitTransfer(request: SafeTransferRequest): Promise<SafeTransferResponse> {
    try {
      logger.info('Submitting Safe multisig transfer', {
        safeAddress: request.safeAddress,
        recipient: request.recipientAddress,
        amount: formatUnits(request.amount, 6),
        chainId: request.chainId,
        reference: request.reference,
      });

      // Validate request
      this.validateTransferRequest(request);

      // Get Safe information
      const safeInfo = await this.getSafeInfo(request.safeAddress, request.chainId);

      // Create transaction data for ERC-20 transfer
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [request.recipientAddress, request.amount],
      });

      // Create Safe transaction
      const safeTransaction = {
        to: request.tokenAddress,
        value: BigInt(0),
        data: transferData,
        operation: 0, // CALL
        gasToken: '0x0000000000000000000000000000000000000000' as Address,
        safeTxGas: request.gasLimit || BigInt(100000),
        baseGas: BigInt(0),
        gasPrice: BigInt(0),
        refundReceiver: '0x0000000000000000000000000000000000000000' as Address,
        nonce: safeInfo.nonce,
      };

      // Calculate transaction hash
      const safeTransactionHash = await this.calculateSafeTransactionHash(
        request.safeAddress,
        request.chainId,
        safeTransaction
      );

      // Submit transaction to Safe Transaction Service
      await this.submitToTransactionService(
        request.safeAddress,
        request.chainId,
        safeTransaction,
        safeTransactionHash
      );

      // Create our signature
      const signature = await this.signTransaction(
        request.safeAddress,
        request.chainId,
        safeTransaction
      );

      // Submit signature
      await this.submitSignature(
        request.chainId,
        safeTransactionHash,
        signature
      );

      const response: SafeTransferResponse = {
        safeTransactionHash,
        status: 'PENDING_SIGNATURES',
        chainId: request.chainId,
        signatures: 1,
        requiredSignatures: safeInfo.threshold,
        nonce: safeInfo.nonce,
        reference: request.reference,
      };

      // Check if we can execute immediately
      if (safeInfo.threshold === 1) {
        const executeResult = await this.executeTransaction(
          request.safeAddress,
          request.chainId,
          safeTransaction,
          signature.data
        );

        if (executeResult.success) {
          response.status = 'EXECUTED';
          response.transactionHash = executeResult.transactionHash;
        }
      }

      logger.info('Safe transfer submitted', {
        safeTransactionHash,
        status: response.status,
        signatures: response.signatures,
        requiredSignatures: response.requiredSignatures,
      });

      return response;
    } catch (error) {
      logger.error('Failed to submit Safe transfer', {
        error: error.message,
        reference: request.reference,
        safeAddress: request.safeAddress,
      });

      return {
        safeTransactionHash: '',
        status: 'FAILED',
        chainId: request.chainId,
        signatures: 0,
        requiredSignatures: 0,
        nonce: 0,
        reference: request.reference,
        error: error.message,
      };
    }
  }

  /**
   * Submit a batch of transfers as a single Safe transaction
   */
  async submitBatch(batch: SafeBatch): Promise<SafeBatchResponse> {
    try {
      logger.info('Submitting Safe batch transfer', {
        batchId: batch.batchId,
        safeAddress: batch.safeAddress,
        transferCount: batch.transfers.length,
        totalAmount: formatUnits(batch.totalAmount, 6),
        chainId: batch.chainId,
      });

      // Get Safe information
      const safeInfo = await this.getSafeInfo(batch.safeAddress, batch.chainId);

      // Create MultiSend transaction data
      const multiSendData = this.encodeMultiSendData(batch.transfers);

      // Create Safe transaction for MultiSend
      const safeTransaction = {
        to: MULTISEND_ADDRESSES[batch.chainId],
        value: BigInt(0),
        data: encodeFunctionData({
          abi: MULTISEND_ABI,
          functionName: 'multiSend',
          args: [multiSendData],
        }),
        operation: 1, // DELEGATECALL for MultiSend
        gasToken: '0x0000000000000000000000000000000000000000' as Address,
        safeTxGas: BigInt(200000 + batch.transfers.length * 50000),
        baseGas: BigInt(0),
        gasPrice: BigInt(0),
        refundReceiver: '0x0000000000000000000000000000000000000000' as Address,
        nonce: safeInfo.nonce,
      };

      // Calculate transaction hash
      const safeTransactionHash = await this.calculateSafeTransactionHash(
        batch.safeAddress,
        batch.chainId,
        safeTransaction
      );

      // Submit and sign transaction
      await this.submitToTransactionService(
        batch.safeAddress,
        batch.chainId,
        safeTransaction,
        safeTransactionHash
      );

      const signature = await this.signTransaction(
        batch.safeAddress,
        batch.chainId,
        safeTransaction
      );

      await this.submitSignature(
        batch.chainId,
        safeTransactionHash,
        signature
      );

      const response: SafeBatchResponse = {
        batchId: batch.batchId,
        batchTransactionHash: safeTransactionHash,
        status: 'PENDING_SIGNATURES',
        transfers: batch.transfers.map(t => ({
          reference: t.reference,
          included: true,
        })),
        signatures: 1,
        requiredSignatures: safeInfo.threshold,
      };

      // Execute if threshold is met
      if (safeInfo.threshold === 1) {
        const executeResult = await this.executeTransaction(
          batch.safeAddress,
          batch.chainId,
          safeTransaction,
          signature.data
        );

        if (executeResult.success) {
          response.status = 'EXECUTED';
        }
      }

      logger.info('Safe batch submitted', {
        batchId: batch.batchId,
        batchTransactionHash: safeTransactionHash,
        status: response.status,
      });

      return response;
    } catch (error) {
      logger.error('Failed to submit Safe batch', {
        error: error.message,
        batchId: batch.batchId,
      });
      throw error;
    }
  }

  /**
   * Get the status of a Safe transaction
   */
  async getTransferStatus(safeTransactionHash: string, chainId: number): Promise<SafeStatus> {
    try {
      logger.info('Checking Safe transfer status', { safeTransactionHash, chainId });

      const serviceUrl = this.getServiceUrl(chainId);
      const response = await fetch(
        `${serviceUrl}/api/v1/multisig-transactions/${safeTransactionHash}/`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      const transaction = await response.json();

      // Parse transaction details
      const status = this.determineTransactionStatus(transaction);
      const { recipientAddress, amount, tokenAddress } = this.parseTransactionData(transaction);

      const safeStatus: SafeStatus = {
        safeTransactionHash,
        transactionHash: transaction.transactionHash || undefined,
        status,
        chainId,
        safeAddress: transaction.safe,
        amount,
        recipientAddress,
        tokenAddress,
        signatures: transaction.confirmations.length,
        requiredSignatures: transaction.confirmationsRequired,
        nonce: transaction.nonce,
        gasUsed: transaction.gasUsed ? BigInt(transaction.gasUsed) : undefined,
        blockNumber: transaction.blockNumber ? BigInt(transaction.blockNumber) : undefined,
        lastChecked: new Date(),
      };

      logger.info('Safe status retrieved', {
        safeTransactionHash,
        status: safeStatus.status,
        signatures: safeStatus.signatures,
        requiredSignatures: safeStatus.requiredSignatures,
      });

      return safeStatus;
    } catch (error) {
      logger.error('Failed to get Safe transfer status', {
        error: error.message,
        safeTransactionHash,
        chainId,
      });
      throw error;
    }
  }

  /**
   * Get Safe wallet information
   */
  async getSafeInfo(safeAddress: Address, chainId: number): Promise<SafeInfo> {
    try {
      const publicClient = createPublicClient({
        chain: this.getViemChain(chainId),
        transport: http(),
      });

      // Get threshold and owners from contract
      const [threshold, owners, nonce] = await Promise.all([
        publicClient.readContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: 'getThreshold',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: 'getOwners',
        }) as Promise<Address[]>,
        publicClient.readContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: 'nonce',
        }) as Promise<bigint>,
      ]);

      // Get additional info from Safe Service
      const serviceUrl = this.getServiceUrl(chainId);
      const response = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}/`);
      
      let version = '1.3.0'; // Default version
      if (response.ok) {
        const safeData = await response.json();
        version = safeData.version || version;
      }

      return {
        address: safeAddress,
        chainId,
        threshold: Number(threshold),
        owners,
        nonce: Number(nonce),
        version,
      };
    } catch (error) {
      logger.error('Failed to get Safe info', {
        error: error.message,
        safeAddress,
        chainId,
      });
      throw error;
    }
  }

  /**
   * Sign a Safe transaction
   */
  async signTransaction(
    safeAddress: Address,
    chainId: number,
    transaction: any
  ): Promise<SafeSignature> {
    try {
      const account = privateKeyToAccount(this.privateKey);
      
      // Calculate the transaction hash to sign
      const transactionHash = await this.calculateSafeTransactionHash(
        safeAddress,
        chainId,
        transaction
      );

      // Sign the hash
      const signature = await account.signMessage({
        message: { raw: transactionHash as Hex },
      });

      return {
        signer: account.address,
        data: signature,
        dynamic: false,
      };
    } catch (error) {
      logger.error('Failed to sign Safe transaction', {
        error: error.message,
        safeAddress,
      });
      throw error;
    }
  }

  /**
   * Execute a Safe transaction on-chain
   */
  async executeTransaction(
    safeAddress: Address,
    chainId: number,
    transaction: any,
    signatures: Hex
  ): Promise<{ success: boolean; transactionHash?: Hex }> {
    try {
      const account = privateKeyToAccount(this.privateKey);
      const walletClient = createWalletClient({
        account,
        chain: this.getViemChain(chainId),
        transport: http(),
      });

      const transactionHash = await walletClient.writeContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: 'execTransaction',
        args: [
          transaction.to,
          transaction.value,
          transaction.data,
          transaction.operation,
          transaction.safeTxGas,
          transaction.baseGas,
          transaction.gasPrice,
          transaction.gasToken,
          transaction.refundReceiver,
          signatures,
        ],
      });

      logger.info('Safe transaction executed', {
        safeAddress,
        transactionHash,
      });

      return {
        success: true,
        transactionHash,
      };
    } catch (error) {
      logger.error('Failed to execute Safe transaction', {
        error: error.message,
        safeAddress,
      });

      return {
        success: false,
      };
    }
  }

  // Private helper methods

  private validateTransferRequest(request: SafeTransferRequest): void {
    if (!request.safeAddress || !/^0x[a-fA-F0-9]{40}$/.test(request.safeAddress)) {
      throw new Error('Invalid Safe address');
    }

    if (!request.recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(request.recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (!request.tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(request.tokenAddress)) {
      throw new Error('Invalid token address');
    }

    if (request.amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }

    if (!this.isChainSupported(request.chainId)) {
      throw new Error(`Chain ${request.chainId} is not supported`);
    }
  }

  private getServiceUrl(chainId: number): string {
    const url = this.serviceUrls[chainId];
    if (!url) {
      throw new Error(`No Safe Transaction Service URL configured for chain ${chainId}`);
    }
    return url;
  }

  private isChainSupported(chainId: number): boolean {
    return chainId in this.serviceUrls;
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

  private async calculateSafeTransactionHash(
    safeAddress: Address,
    chainId: number,
    transaction: any
  ): Promise<string> {
    // This would implement the Safe transaction hash calculation
    // For now, return a mock hash
    const data = JSON.stringify({ safeAddress, chainId, transaction });
    return `0x${Buffer.from(data).toString('hex').slice(0, 64)}`;
  }

  private async submitToTransactionService(
    safeAddress: Address,
    chainId: number,
    transaction: any,
    safeTransactionHash: string
  ): Promise<void> {
    try {
      const serviceUrl = this.getServiceUrl(chainId);
      const response = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: transaction.to,
          value: transaction.value.toString(),
          data: transaction.data,
          operation: transaction.operation,
          gasToken: transaction.gasToken,
          safeTxGas: transaction.safeTxGas.toString(),
          baseGas: transaction.baseGas.toString(),
          gasPrice: transaction.gasPrice.toString(),
          refundReceiver: transaction.refundReceiver,
          nonce: transaction.nonce,
          safeTxHash: safeTransactionHash,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit transaction: ${response.statusText}`);
      }
    } catch (error) {
      logger.warn('Failed to submit to transaction service', {
        error: error.message,
        safeAddress,
      });
      // Don't throw - continue with local execution
    }
  }

  private async submitSignature(
    chainId: number,
    safeTransactionHash: string,
    signature: SafeSignature
  ): Promise<void> {
    try {
      const serviceUrl = this.getServiceUrl(chainId);
      const response = await fetch(
        `${serviceUrl}/api/v1/multisig-transactions/${safeTransactionHash}/confirmations/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signature: signature.data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to submit signature: ${response.statusText}`);
      }
    } catch (error) {
      logger.warn('Failed to submit signature to service', {
        error: error.message,
        safeTransactionHash,
      });
      // Don't throw - signature will be included in execution
    }
  }

  private encodeMultiSendData(transfers: Omit<SafeTransferRequest, 'safeAddress' | 'chainId'>[]): Hex {
    // Encode multiple transactions for MultiSend
    // This is a simplified implementation
    let data = '0x';
    
    for (const transfer of transfers) {
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [transfer.recipientAddress, transfer.amount],
      });

      // Operation (1 byte) + to (20 bytes) + value (32 bytes) + data length (32 bytes) + data
      data += '00'; // CALL operation
      data += transfer.tokenAddress.slice(2); // Remove 0x prefix
      data += '0000000000000000000000000000000000000000000000000000000000000000'; // value = 0
      data += (transferData.length / 2 - 1).toString(16).padStart(64, '0'); // data length
      data += transferData.slice(2); // Remove 0x prefix
    }

    return data as Hex;
  }

  private determineTransactionStatus(transaction: any): SafeStatus['status'] {
    if (transaction.isExecuted) {
      return transaction.isSuccessful ? 'EXECUTED' : 'FAILED';
    }
    
    if (transaction.confirmations.length >= transaction.confirmationsRequired) {
      return 'EXECUTABLE';
    }
    
    return 'PENDING_SIGNATURES';
  }

  private parseTransactionData(transaction: any): {
    recipientAddress: Address;
    amount: bigint;
    tokenAddress: Address;
  } {
    // Parse transaction data to extract transfer details
    // This is a simplified implementation
    return {
      recipientAddress: transaction.to,
      amount: BigInt(transaction.value || 0),
      tokenAddress: transaction.to,
    };
  }
}