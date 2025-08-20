import { PrismaClient, DisbursementStatus, PaymentMethod, Disbursement } from '@orenna/db';
import { logger } from '../utils/logger';

export interface BankStatement {
  transactionId: string;
  date: Date;
  amount: number;
  description: string;
  reference?: string;
  accountNumber: string;
  routingNumber?: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'PENDING' | 'CLEARED' | 'RETURNED';
}

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string; // Wei amount as string
  gasUsed: string;
  gasPrice: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: Date;
  confirmations: number;
  tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

export interface ReconciliationMatch {
  disbursementId: number;
  matchType: 'BANK_STATEMENT' | 'BLOCKCHAIN_TX' | 'MANUAL';
  matchConfidence: number; // 0-100
  matchedReference: string;
  matchedAmount: number;
  amountDifference: number;
  autoReconciled: boolean;
  requiresReview: boolean;
  matchedAt: Date;
}

export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  paymentMethods: PaymentMethod[];
  matchCriteria: {
    amountTolerance: number; // Percentage tolerance for amount matching
    dateRangeDays: number; // Days to look back/forward for matches
    referencePatterns: string[]; // Regex patterns for reference matching
    minimumConfidence: number; // Minimum confidence required for auto-reconciliation
  };
  actions: {
    autoReconcile: boolean;
    sendNotification: boolean;
    requireApproval: boolean;
  };
}

export interface ReconciliationSummary {
  totalDisbursements: number;
  reconciledCount: number;
  pendingCount: number;
  unreconciledCount: number;
  autoReconciledCount: number;
  manualReconciledCount: number;
  requiresReviewCount: number;
  totalAmount: bigint;
  reconciledAmount: bigint;
  processingStartTime: Date;
  processingEndTime: Date;
  processingDuration: number; // milliseconds
}

export class ReconciliationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Automatically reconcile payments with bank statements
   */
  async reconcileBankStatements(statements: BankStatement[]): Promise<ReconciliationSummary> {
    const startTime = new Date();
    logger.info('Starting bank statement reconciliation', { statementCount: statements.length });

    let reconciledCount = 0;
    let autoReconciledCount = 0;
    let requiresReviewCount = 0;

    try {
      // Get unreconciled ACH disbursements from the last 30 days
      const unreconciledDisbursements = await this.prisma.disbursement.findMany({
        where: {
          method: PaymentMethod.ACH,
          status: { in: [DisbursementStatus.CONFIRMED, DisbursementStatus.PROCESSING] },
          reconciledAt: null,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          invoice: {
            include: {
              contract: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      });

      logger.info('Found unreconciled disbursements', { count: unreconciledDisbursements.length });

      // Load reconciliation rules
      const rules = await this.getReconciliationRules();

      // Process each statement entry
      for (const statement of statements) {
        if (statement.type !== 'DEBIT' || statement.status !== 'CLEARED') {
          continue; // Only process cleared debits (outgoing payments)
        }

        const matches = await this.findDisbursementMatches(statement, unreconciledDisbursements, rules);

        for (const match of matches) {
          try {
            if (match.autoReconciled) {
              await this.autoReconcileDisbursement(match, statement);
              autoReconciledCount++;
              reconciledCount++;
            } else if (match.requiresReview) {
              await this.createReconciliationReview(match, statement);
              requiresReviewCount++;
            }

            logger.info('Processed reconciliation match', {
              disbursementId: match.disbursementId,
              matchType: match.matchType,
              confidence: match.matchConfidence,
              autoReconciled: match.autoReconciled,
            });
          } catch (error) {
            logger.error('Failed to process reconciliation match', {
              error: error.message,
              disbursementId: match.disbursementId,
              statementId: statement.transactionId,
            });
          }
        }
      }

      const endTime = new Date();
      const summary: ReconciliationSummary = {
        totalDisbursements: unreconciledDisbursements.length,
        reconciledCount,
        pendingCount: unreconciledDisbursements.length - reconciledCount,
        unreconciledCount: unreconciledDisbursements.length - reconciledCount,
        autoReconciledCount,
        manualReconciledCount: reconciledCount - autoReconciledCount,
        requiresReviewCount,
        totalAmount: unreconciledDisbursements.reduce((sum, d) => sum + d.amount, BigInt(0)),
        reconciledAmount: BigInt(0), // Would be calculated from reconciled disbursements
        processingStartTime: startTime,
        processingEndTime: endTime,
        processingDuration: endTime.getTime() - startTime.getTime(),
      };

      logger.info('Bank statement reconciliation completed', summary);
      return summary;
    } catch (error) {
      logger.error('Failed to reconcile bank statements', { error: error.message });
      throw error;
    }
  }

  /**
   * Automatically reconcile payments with blockchain transactions
   */
  async reconcileBlockchainTransactions(transactions: BlockchainTransaction[]): Promise<ReconciliationSummary> {
    const startTime = new Date();
    logger.info('Starting blockchain transaction reconciliation', { transactionCount: transactions.length });

    let reconciledCount = 0;
    let autoReconciledCount = 0;
    let requiresReviewCount = 0;

    try {
      // Get unreconciled crypto disbursements from the last 7 days
      const unreconciledDisbursements = await this.prisma.disbursement.findMany({
        where: {
          method: { in: [PaymentMethod.USDC, PaymentMethod.SAFE_MULTISIG] },
          status: { in: [DisbursementStatus.CONFIRMED, DisbursementStatus.PROCESSING] },
          reconciledAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          invoice: {
            include: {
              contract: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      });

      logger.info('Found unreconciled crypto disbursements', { count: unreconciledDisbursements.length });

      // Load reconciliation rules
      const rules = await this.getReconciliationRules();

      // Process each blockchain transaction
      for (const tx of transactions) {
        if (tx.status !== 'SUCCESS') {
          continue; // Only process successful transactions
        }

        const matches = await this.findDisbursementMatchesBlockchain(tx, unreconciledDisbursements, rules);

        for (const match of matches) {
          try {
            if (match.autoReconciled) {
              await this.autoReconcileBlockchainDisbursement(match, tx);
              autoReconciledCount++;
              reconciledCount++;
            } else if (match.requiresReview) {
              await this.createBlockchainReconciliationReview(match, tx);
              requiresReviewCount++;
            }

            logger.info('Processed blockchain reconciliation match', {
              disbursementId: match.disbursementId,
              transactionHash: tx.hash,
              confidence: match.matchConfidence,
              autoReconciled: match.autoReconciled,
            });
          } catch (error) {
            logger.error('Failed to process blockchain reconciliation match', {
              error: error.message,
              disbursementId: match.disbursementId,
              transactionHash: tx.hash,
            });
          }
        }
      }

      const endTime = new Date();
      const summary: ReconciliationSummary = {
        totalDisbursements: unreconciledDisbursements.length,
        reconciledCount,
        pendingCount: unreconciledDisbursements.length - reconciledCount,
        unreconciledCount: unreconciledDisbursements.length - reconciledCount,
        autoReconciledCount,
        manualReconciledCount: reconciledCount - autoReconciledCount,
        requiresReviewCount,
        totalAmount: unreconciledDisbursements.reduce((sum, d) => sum + d.amount, BigInt(0)),
        reconciledAmount: BigInt(0), // Would be calculated from reconciled disbursements
        processingStartTime: startTime,
        processingEndTime: endTime,
        processingDuration: endTime.getTime() - startTime.getTime(),
      };

      logger.info('Blockchain transaction reconciliation completed', summary);
      return summary;
    } catch (error) {
      logger.error('Failed to reconcile blockchain transactions', { error: error.message });
      throw error;
    }
  }

  /**
   * Find potential disbursement matches for a bank statement entry
   */
  private async findDisbursementMatches(
    statement: BankStatement,
    disbursements: any[],
    rules: ReconciliationRule[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    for (const disbursement of disbursements) {
      for (const rule of rules) {
        if (!rule.enabled || !rule.paymentMethods.includes(disbursement.method)) {
          continue;
        }

        const confidence = this.calculateMatchConfidence(statement, disbursement, rule);

        if (confidence >= rule.matchCriteria.minimumConfidence) {
          const amountDifference = Math.abs(statement.amount - Number(disbursement.amount) / 100);

          matches.push({
            disbursementId: disbursement.id,
            matchType: 'BANK_STATEMENT',
            matchConfidence: confidence,
            matchedReference: statement.reference || statement.transactionId,
            matchedAmount: statement.amount,
            amountDifference,
            autoReconciled: confidence >= 90 && rule.actions.autoReconcile,
            requiresReview: confidence < 90 || amountDifference > 0.01,
            matchedAt: new Date(),
          });
        }
      }
    }

    // Sort matches by confidence (highest first)
    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  /**
   * Find potential disbursement matches for a blockchain transaction
   */
  private async findDisbursementMatchesBlockchain(
    tx: BlockchainTransaction,
    disbursements: any[],
    rules: ReconciliationRule[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    for (const disbursement of disbursements) {
      for (const rule of rules) {
        if (!rule.enabled || !rule.paymentMethods.includes(disbursement.method)) {
          continue;
        }

        const confidence = this.calculateBlockchainMatchConfidence(tx, disbursement, rule);

        if (confidence >= rule.matchCriteria.minimumConfidence) {
          // For USDC, check token transfers
          let matchedAmount = 0;
          if (disbursement.method === PaymentMethod.USDC && tx.tokenTransfers) {
            const usdcTransfer = tx.tokenTransfers.find(
              transfer => 
                transfer.tokenSymbol === 'USDC' &&
                transfer.to.toLowerCase() === disbursement.recipientAddress?.toLowerCase()
            );
            if (usdcTransfer) {
              matchedAmount = parseFloat(usdcTransfer.value) / Math.pow(10, usdcTransfer.tokenDecimals);
            }
          } else {
            // For ETH or other native currency transfers
            matchedAmount = parseFloat(tx.value) / Math.pow(10, 18); // Convert from Wei
          }

          const amountDifference = Math.abs(matchedAmount - Number(disbursement.amount) / 100);

          matches.push({
            disbursementId: disbursement.id,
            matchType: 'BLOCKCHAIN_TX',
            matchConfidence: confidence,
            matchedReference: tx.hash,
            matchedAmount,
            amountDifference,
            autoReconciled: confidence >= 95 && rule.actions.autoReconcile,
            requiresReview: confidence < 95 || amountDifference > 0.01,
            matchedAt: new Date(),
          });
        }
      }
    }

    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  /**
   * Calculate match confidence for bank statement
   */
  private calculateMatchConfidence(
    statement: BankStatement,
    disbursement: any,
    rule: ReconciliationRule
  ): number {
    let confidence = 0;

    // Amount matching (40% weight)
    const amountDiff = Math.abs(statement.amount - Number(disbursement.amount) / 100);
    const amountTolerance = (Number(disbursement.amount) / 100) * (rule.matchCriteria.amountTolerance / 100);
    if (amountDiff <= amountTolerance) {
      confidence += 40 * (1 - amountDiff / amountTolerance);
    }

    // Date matching (20% weight)
    const dateDiff = Math.abs(statement.date.getTime() - disbursement.scheduledAt?.getTime() || 0);
    const dateToleranceMs = rule.matchCriteria.dateRangeDays * 24 * 60 * 60 * 1000;
    if (dateDiff <= dateToleranceMs) {
      confidence += 20 * (1 - dateDiff / dateToleranceMs);
    }

    // Reference matching (25% weight)
    if (statement.reference && disbursement.reference) {
      if (statement.reference.includes(disbursement.reference) || 
          disbursement.reference.includes(statement.reference)) {
        confidence += 25;
      }
    }

    // Account matching (15% weight)
    if (statement.accountNumber === disbursement.bankAccountNumber) {
      confidence += 15;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Calculate match confidence for blockchain transaction
   */
  private calculateBlockchainMatchConfidence(
    tx: BlockchainTransaction,
    disbursement: any,
    rule: ReconciliationRule
  ): number {
    let confidence = 0;

    // Exact transaction hash match (100% confidence)
    if (disbursement.transactionHash && disbursement.transactionHash === tx.hash) {
      return 100;
    }

    // Recipient address matching (50% weight)
    if (disbursement.recipientAddress && 
        tx.to.toLowerCase() === disbursement.recipientAddress.toLowerCase()) {
      confidence += 50;
    }

    // Amount matching (30% weight)
    let txAmount = 0;
    if (disbursement.method === PaymentMethod.USDC && tx.tokenTransfers) {
      const usdcTransfer = tx.tokenTransfers.find(
        transfer => 
          transfer.tokenSymbol === 'USDC' &&
          transfer.to.toLowerCase() === disbursement.recipientAddress?.toLowerCase()
      );
      if (usdcTransfer) {
        txAmount = parseFloat(usdcTransfer.value) / Math.pow(10, usdcTransfer.tokenDecimals);
      }
    } else {
      txAmount = parseFloat(tx.value) / Math.pow(10, 18);
    }

    const amountDiff = Math.abs(txAmount - Number(disbursement.amount) / 100);
    const amountTolerance = (Number(disbursement.amount) / 100) * (rule.matchCriteria.amountTolerance / 100);
    if (amountDiff <= amountTolerance) {
      confidence += 30 * (1 - amountDiff / amountTolerance);
    }

    // Date matching (20% weight)
    const dateDiff = Math.abs(tx.timestamp.getTime() - disbursement.scheduledAt?.getTime() || 0);
    const dateToleranceMs = rule.matchCriteria.dateRangeDays * 24 * 60 * 60 * 1000;
    if (dateDiff <= dateToleranceMs) {
      confidence += 20 * (1 - dateDiff / dateToleranceMs);
    }

    return Math.min(confidence, 100);
  }

  /**
   * Automatically reconcile a disbursement with bank statement
   */
  private async autoReconcileDisbursement(match: ReconciliationMatch, statement: BankStatement): Promise<void> {
    await this.prisma.disbursement.update({
      where: { id: match.disbursementId },
      data: {
        status: DisbursementStatus.RECONCILED,
        bankReference: statement.transactionId,
        reconciledAt: new Date(),
        reconciliationType: 'AUTO',
        reconciliationConfidence: match.matchConfidence,
      },
    });

    // Create reconciliation log
    await this.prisma.reconciliationLog.create({
      data: {
        disbursementId: match.disbursementId,
        matchType: match.matchType,
        matchConfidence: match.matchConfidence,
        externalReference: statement.transactionId,
        matchedAmount: match.matchedAmount,
        amountDifference: match.amountDifference,
        autoReconciled: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Automatically reconcile a disbursement with blockchain transaction
   */
  private async autoReconcileBlockchainDisbursement(match: ReconciliationMatch, tx: BlockchainTransaction): Promise<void> {
    await this.prisma.disbursement.update({
      where: { id: match.disbursementId },
      data: {
        status: DisbursementStatus.RECONCILED,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations,
        reconciledAt: new Date(),
        reconciliationType: 'AUTO',
        reconciliationConfidence: match.matchConfidence,
      },
    });

    // Create reconciliation log
    await this.prisma.reconciliationLog.create({
      data: {
        disbursementId: match.disbursementId,
        matchType: match.matchType,
        matchConfidence: match.matchConfidence,
        externalReference: tx.hash,
        matchedAmount: match.matchedAmount,
        amountDifference: match.amountDifference,
        autoReconciled: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Create reconciliation review for manual approval
   */
  private async createReconciliationReview(match: ReconciliationMatch, statement: BankStatement): Promise<void> {
    await this.prisma.reconciliationReview.create({
      data: {
        disbursementId: match.disbursementId,
        matchType: match.matchType,
        matchConfidence: match.matchConfidence,
        externalReference: statement.transactionId,
        externalAmount: match.matchedAmount,
        amountDifference: match.amountDifference,
        status: 'PENDING_REVIEW',
        reviewReason: match.matchConfidence < 90 ? 'LOW_CONFIDENCE' : 'AMOUNT_MISMATCH',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Create blockchain reconciliation review for manual approval
   */
  private async createBlockchainReconciliationReview(match: ReconciliationMatch, tx: BlockchainTransaction): Promise<void> {
    await this.prisma.reconciliationReview.create({
      data: {
        disbursementId: match.disbursementId,
        matchType: match.matchType,
        matchConfidence: match.matchConfidence,
        externalReference: tx.hash,
        externalAmount: match.matchedAmount,
        amountDifference: match.amountDifference,
        status: 'PENDING_REVIEW',
        reviewReason: match.matchConfidence < 95 ? 'LOW_CONFIDENCE' : 'AMOUNT_MISMATCH',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Get active reconciliation rules
   */
  private async getReconciliationRules(): Promise<ReconciliationRule[]> {
    // For now, return default rules. In a real implementation, these would be stored in the database
    return [
      {
        id: 'default_ach',
        name: 'Default ACH Reconciliation',
        description: 'Standard ACH payment reconciliation rules',
        enabled: true,
        paymentMethods: [PaymentMethod.ACH],
        matchCriteria: {
          amountTolerance: 0.1, // 0.1% tolerance
          dateRangeDays: 5,
          referencePatterns: ['PAY-*', 'INV-*'],
          minimumConfidence: 70,
        },
        actions: {
          autoReconcile: true,
          sendNotification: true,
          requireApproval: false,
        },
      },
      {
        id: 'default_crypto',
        name: 'Default Crypto Reconciliation',
        description: 'Standard cryptocurrency payment reconciliation rules',
        enabled: true,
        paymentMethods: [PaymentMethod.USDC, PaymentMethod.SAFE_MULTISIG],
        matchCriteria: {
          amountTolerance: 0.01, // 0.01% tolerance (crypto is more precise)
          dateRangeDays: 2,
          referencePatterns: [],
          minimumConfidence: 80,
        },
        actions: {
          autoReconcile: true,
          sendNotification: true,
          requireApproval: false,
        },
      },
    ];
  }

  /**
   * Process pending reconciliation reviews
   */
  async processPendingReviews(): Promise<void> {
    logger.info('Processing pending reconciliation reviews');

    const pendingReviews = await this.prisma.reconciliationReview.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        disbursement: {
          include: {
            invoice: {
              include: {
                contract: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const review of pendingReviews) {
      try {
        // Auto-approve reviews with high confidence and small amount differences
        if (review.matchConfidence >= 85 && review.amountDifference <= 1.0) {
          await this.approveReconciliationReview(review.id, 'AUTO_APPROVED');
          logger.info('Auto-approved reconciliation review', {
            reviewId: review.id,
            disbursementId: review.disbursementId,
            confidence: review.matchConfidence,
          });
        }
        
        // Auto-reject reviews with very low confidence
        if (review.matchConfidence < 50) {
          await this.rejectReconciliationReview(review.id, 'LOW_CONFIDENCE', 'Automatically rejected due to low match confidence');
          logger.info('Auto-rejected reconciliation review', {
            reviewId: review.id,
            disbursementId: review.disbursementId,
            confidence: review.matchConfidence,
          });
        }
      } catch (error) {
        logger.error('Failed to process reconciliation review', {
          error: error.message,
          reviewId: review.id,
        });
      }
    }
  }

  /**
   * Approve reconciliation review
   */
  async approveReconciliationReview(reviewId: number, approvedBy: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const review = await tx.reconciliationReview.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error(`Reconciliation review ${reviewId} not found`);
      }

      // Update review status
      await tx.reconciliationReview.update({
        where: { id: reviewId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Reconcile the disbursement
      await tx.disbursement.update({
        where: { id: review.disbursementId },
        data: {
          status: DisbursementStatus.RECONCILED,
          bankReference: review.matchType === 'BANK_STATEMENT' ? review.externalReference : undefined,
          transactionHash: review.matchType === 'BLOCKCHAIN_TX' ? review.externalReference : undefined,
          reconciledAt: new Date(),
          reconciliationType: 'MANUAL',
          reconciliationConfidence: review.matchConfidence,
        },
      });

      // Create reconciliation log
      await tx.reconciliationLog.create({
        data: {
          disbursementId: review.disbursementId,
          matchType: review.matchType,
          matchConfidence: review.matchConfidence,
          externalReference: review.externalReference,
          matchedAmount: review.externalAmount,
          amountDifference: review.amountDifference,
          autoReconciled: false,
          approvedBy,
          processedAt: new Date(),
        },
      });
    });
  }

  /**
   * Reject reconciliation review
   */
  async rejectReconciliationReview(reviewId: number, rejectedBy: string, reason: string): Promise<void> {
    await this.prisma.reconciliationReview.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }
}