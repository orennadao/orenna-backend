import { FastifyInstance } from 'fastify';
import { Address, Hash, parseAbi, getContract, parseEther, formatUnits } from 'viem';
import { blockchainService } from './blockchain.js';
import { getEnv } from '../types/env.js';

const env = getEnv();

// Contract ABIs for payment-related functions
export const PAYMENT_TOKEN_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]);

export const REPAYMENT_ESCROW_ABI = parseAbi([
  'function notifyProceeds(uint256 projectId, uint256 amount, bytes32 considerationRef)',
  'function configureRepayment(uint256 projectId, uint256 forwardPrincipal, uint256 repaymentCap, uint256 platformFeeBps, uint256 platformFeeCap, address funder, address stewardOrPool, address platformTreasury, address paymentToken, uint8 policy)',
  'function getRepaymentStatus(uint256 projectId) view returns ((uint256,uint256,uint256,uint256,address,address,address,address,uint8,uint256,uint256,bool))',
  'event ProceedsReceived(uint256 indexed projectId, uint256 amount, bytes32 considerationRef)',
  'event PaidFunder(uint256 indexed projectId, uint256 amount)',
  'event PaidPlatform(uint256 indexed projectId, uint256 amount)',
  'event PaidSteward(uint256 indexed projectId, uint256 amount)',
]);

export const ALLOCATION_ESCROW_ABI = parseAbi([
  'function sellToBeneficiary(uint256 projectId, address beneficiary, uint256[] tokenIds, uint256[] amounts, bytes32 considerationRef, uint256 proceeds)',
  'function isWindowActive(uint256 projectId) view returns (bool)',
  'function getMarketWindow(uint256 projectId) view returns ((uint64,uint64,uint64,bool,bool,bytes32,uint256))',
  'event UnitsSold(uint256 indexed projectId, address indexed beneficiary, uint256[] tokenIds, uint256[] amounts, bytes32 considerationRef, uint256 proceeds)',
]);

export interface PaymentRequest {
  projectId: number;
  paymentType: 'LIFT_UNIT_PURCHASE' | 'PROJECT_FUNDING' | 'REPAYMENT' | 'PLATFORM_FEE' | 'STEWARD_PAYMENT';
  amount: string;
  paymentToken: Address;
  payerAddress: Address;
  recipientAddress: Address;
  chainId: number;
  description?: string;
  metadata?: Record<string, any>;
  
  // For lift unit purchases
  tokenIds?: string[];
  tokenAmounts?: string[];
  
  // For escrow configuration
  escrowConfig?: {
    forwardPrincipal?: string;
    repaymentCap?: string;
    platformFeeBps?: number;
    platformFeeCap?: string;
    funder?: Address;
    stewardOrPool?: Address;
    policy?: number; // RepaymentPolicy enum value
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txHash?: Hash;
  error?: string;
  estimatedGas?: string;
}

export class PaymentService {
  constructor(private app: FastifyInstance) {}

  async initializePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate request
      const validation = this.validatePaymentRequest(request);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Create payment record in database
      const payment = await this.app.prisma.payment.create({
        data: {
          paymentType: request.paymentType,
          projectId: request.projectId,
          amount: request.amount,
          paymentToken: request.paymentToken.toLowerCase(),
          chainId: request.chainId,
          payerAddress: request.payerAddress.toLowerCase(),
          recipientAddress: request.recipientAddress.toLowerCase(),
          description: request.description,
          metadata: request.metadata,
          status: 'PENDING',
        }
      });

      // Create initial event
      await this.app.prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'PAYMENT_INITIATED',
          performedBy: request.payerAddress.toLowerCase(),
          amount: request.amount,
          notes: `Payment initiated for ${request.paymentType}`,
          metadata: { request }
        }
      });

      this.app.log.info({ paymentId: payment.id, request }, 'Payment initialized');

      return {
        success: true,
        paymentId: payment.id
      };

    } catch (error) {
      this.app.log.error({ error, request }, 'Failed to initialize payment');
      return {
        success: false,
        error: `Failed to initialize payment: ${error.message}`
      };
    }
  }

  async processLiftTokenPurchase(
    paymentId: string, 
    tokenIds: string[], 
    tokenAmounts: string[],
    considerationRef?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await this.app.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { project: { include: { paymentConfig: true } } }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== 'PENDING') {
        return { success: false, error: `Payment status is ${payment.status}, expected PENDING` };
      }

      if (!payment.project?.paymentConfig?.allocationEscrow) {
        return { success: false, error: 'No allocation escrow configured for project' };
      }

      // Generate consideration reference if not provided
      const consideration = considerationRef || this.generateConsiderationRef(paymentId);

      const walletClient = blockchainService.getWalletClient(payment.chainId);
      const publicClient = blockchainService.getPublicClient(payment.chainId);

      const contract = getContract({
        address: payment.project.paymentConfig.allocationEscrow as Address,
        abi: ALLOCATION_ESCROW_ABI,
        client: { public: publicClient, wallet: walletClient },
      });

      // Check if market window is active
      const isActive = await contract.read.isWindowActive([BigInt(payment.projectId)]);
      if (!isActive) {
        return { success: false, error: 'Market window is not active for this project' };
      }

      // Execute the sale transaction
      const hash = await contract.write.sellToBeneficiary([
        BigInt(payment.projectId),
        payment.recipientAddress as Address,
        tokenIds.map(id => BigInt(id)),
        tokenAmounts.map(amount => BigInt(amount)),
        consideration as `0x${string}`,
        BigInt(payment.amount)
      ]);

      // Update payment with transaction hash
      await this.app.prisma.payment.update({
        where: { id: paymentId },
        data: {
          txHash: hash,
          status: 'CONFIRMED'
        }
      });

      // Create confirmation event
      await this.app.prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'PAYMENT_CONFIRMED',
          performedBy: walletClient.account?.address || '',
          txHash: hash,
          metadata: { 
            tokenIds, 
            tokenAmounts, 
            considerationRef: consideration 
          }
        }
      });

      this.app.log.info({ 
        paymentId, 
        txHash: hash, 
        consideration 
      }, 'Lift unit purchase processed');

      return {
        success: true,
        paymentId,
        txHash: hash
      };

    } catch (error) {
      this.app.log.error({ error, paymentId }, 'Failed to process lift unit purchase');
      
      // Update payment status to failed
      await this.app.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' }
      }).catch(() => {}); // Ignore update errors

      return {
        success: false,
        error: `Failed to process purchase: ${error.message}`
      };
    }
  }

  async notifyProceedsToEscrow(
    paymentId: string,
    considerationRef?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await this.app.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { project: { include: { paymentConfig: true } } }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (!payment.project?.paymentConfig?.repaymentEscrow) {
        return { success: false, error: 'No repayment escrow configured for project' };
      }

      if (payment.proceedsNotified) {
        return { success: false, error: 'Proceeds already notified' };
      }

      const consideration = considerationRef || this.generateConsiderationRef(paymentId);

      const walletClient = blockchainService.getWalletClient(payment.chainId);
      const publicClient = blockchainService.getPublicClient(payment.chainId);

      const contract = getContract({
        address: payment.project.paymentConfig.repaymentEscrow as Address,
        abi: REPAYMENT_ESCROW_ABI,
        client: { public: publicClient, wallet: walletClient },
      });

      // Notify proceeds to repayment escrow
      const hash = await contract.write.notifyProceeds([
        BigInt(payment.projectId!),
        BigInt(payment.amount),
        consideration as `0x${string}`
      ]);

      // Update payment status
      await this.app.prisma.payment.update({
        where: { id: paymentId },
        data: {
          proceedsNotified: true,
          status: 'IN_ESCROW'
        }
      });

      // Create proceeds notification event
      await this.app.prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'PROCEEDS_NOTIFIED',
          performedBy: walletClient.account?.address || '',
          txHash: hash,
          amount: payment.amount,
          metadata: { considerationRef: consideration }
        }
      });

      this.app.log.info({ 
        paymentId, 
        txHash: hash, 
        amount: payment.amount 
      }, 'Proceeds notified to repayment escrow');

      return {
        success: true,
        paymentId,
        txHash: hash
      };

    } catch (error) {
      this.app.log.error({ error, paymentId }, 'Failed to notify proceeds');
      return {
        success: false,
        error: `Failed to notify proceeds: ${error.message}`
      };
    }
  }

  async configureProjectEscrow(
    projectId: number,
    config: {
      forwardPrincipal: string;
      repaymentCap: string;
      platformFeeBps: number;
      platformFeeCap: string;
      funder: Address;
      stewardOrPool: Address;
      paymentToken: Address;
      policy: number; // RepaymentPolicy enum
    },
    chainId: number
  ): Promise<PaymentResult> {
    try {
      const project = await this.app.prisma.project.findUnique({
        where: { id: projectId },
        include: { paymentConfig: true }
      });

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      if (!project.paymentConfig?.repaymentEscrow) {
        return { success: false, error: 'No repayment escrow configured for project' };
      }

      const walletClient = blockchainService.getWalletClient(chainId);
      const publicClient = blockchainService.getPublicClient(chainId);

      const contract = getContract({
        address: project.paymentConfig.repaymentEscrow as Address,
        abi: REPAYMENT_ESCROW_ABI,
        client: { public: publicClient, wallet: walletClient },
      });

      // Configure repayment in the escrow contract
      const hash = await contract.write.configureRepayment([
        BigInt(projectId),
        BigInt(config.forwardPrincipal),
        BigInt(config.repaymentCap),
        BigInt(config.platformFeeBps),
        BigInt(config.platformFeeCap),
        config.funder,
        config.stewardOrPool,
        env.PLATFORM_TREASURY_ADDRESS as Address || walletClient.account!.address,
        config.paymentToken,
        config.policy
      ]);

      this.app.log.info({ 
        projectId, 
        txHash: hash, 
        config 
      }, 'Project escrow configured');

      return {
        success: true,
        txHash: hash
      };

    } catch (error) {
      this.app.log.error({ error, projectId, config }, 'Failed to configure project escrow');
      return {
        success: false,
        error: `Failed to configure escrow: ${error.message}`
      };
    }
  }

  async getPaymentStatus(paymentId: string) {
    return await this.app.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        project: {
          select: { id: true, name: true, slug: true }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  async getProjectPayments(
    projectId: number, 
    filters: {
      status?: string;
      paymentType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, paymentType, limit = 50, offset = 0 } = filters;

    const where: any = { projectId };
    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;

    const [payments, total] = await Promise.all([
      this.app.prisma.payment.findMany({
        where,
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset
      }),
      this.app.prisma.payment.count({ where })
    ]);

    return { payments, total, limit, offset };
  }

  private validatePaymentRequest(request: PaymentRequest): { isValid: boolean; error?: string } {
    if (!request.projectId || request.projectId <= 0) {
      return { isValid: false, error: 'Invalid project ID' };
    }

    if (!request.amount || BigInt(request.amount) <= 0) {
      return { isValid: false, error: 'Invalid payment amount' };
    }

    if (!request.payerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { isValid: false, error: 'Invalid payer address' };
    }

    if (!request.recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { isValid: false, error: 'Invalid recipient address' };
    }

    if (!request.paymentToken.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { isValid: false, error: 'Invalid payment token address' };
    }

    if (![1, 11155111, 137, 42161].includes(request.chainId)) {
      return { isValid: false, error: 'Unsupported chain ID' };
    }

    return { isValid: true };
  }

  private generateConsiderationRef(paymentId: string): string {
    // Generate a deterministic consideration reference based on payment ID
    const encoder = new TextEncoder();
    const data = encoder.encode(`payment:${paymentId}:${Date.now()}`);
    
    // Simple hash - in production you might want to use a proper hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    
    return `0x${Math.abs(hash).toString(16).padStart(8, '0').repeat(8).slice(0, 64)}`;
  }
}