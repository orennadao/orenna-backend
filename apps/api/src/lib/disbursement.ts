import { PrismaClient, Disbursement, DisbursementStatus, PaymentMethod } from '@prisma/client';
import { logger } from '../utils/logger';

export interface PaymentData {
  paymentMethod: PaymentMethod;
  recipientAddress?: string; // For crypto payments
  bankDetails?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    bankName: string;
  };
  safeDetails?: {
    safeAddress: string;
    chainId: number;
    threshold: number;
  };
  memo?: string;
  reference?: string;
}

export interface BatchResult {
  paymentRunId: string;
  totalDisbursements: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmountCents: bigint;
  results: DisbursementResult[];
}

export interface DisbursementResult {
  disbursementId: number;
  success: boolean;
  txHash?: string;
  bankReference?: string;
  error?: string;
  executedAt: Date;
}

export interface ACHResult {
  disbursementId: number;
  success: boolean;
  achTransactionId: string;
  bankReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  error?: string;
}

export interface CryptoResult {
  disbursementId: number;
  success: boolean;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: bigint;
  confirmations: number;
  error?: string;
}

export interface SafeResult {
  disbursementId: number;
  success: boolean;
  safeTransactionHash: string;
  signatures: number;
  requiredSignatures: number;
  executed: boolean;
  error?: string;
}

export interface PaymentStatus {
  disbursementId: number;
  status: DisbursementStatus;
  paymentMethod: PaymentMethod;
  amountCents: bigint;
  recipient: string;
  txHash?: string;
  bankReference?: string;
  confirmations?: number;
  lastChecked: Date;
  error?: string;
}

export interface RetryResult {
  disbursementId: number;
  previousStatus: DisbursementStatus;
  newStatus: DisbursementStatus;
  success: boolean;
  error?: string;
}

export interface ReconciliationReport {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  totalDisbursements: number;
  reconciledCount: number;
  unreconciledCount: number;
  totalAmount: bigint;
  reconciledAmount: bigint;
  unreconciledDisbursements: {
    id: number;
    amount: bigint;
    paymentMethod: PaymentMethod;
    status: DisbursementStatus;
    createdAt: Date;
  }[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class DisbursementService {
  constructor(private prisma: PrismaClient) {}

  // Payment execution
  async createDisbursement(invoiceId: number, paymentData: PaymentData): Promise<Disbursement> {
    try {
      logger.info('Creating disbursement', { invoiceId, paymentMethod: paymentData.paymentMethod });

      // Validate invoice
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          contract: {
            include: {
              vendor: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      if (invoice.status !== 'APPROVED' && invoice.status !== 'SCHEDULED') {
        throw new Error(`Invoice must be approved or scheduled for payment. Current status: ${invoice.status}`);
      }

      // Validate payment method against vendor preferences
      await this.validatePaymentMethod(invoice.contract.vendorId, paymentData.paymentMethod);

      // Create disbursement record
      const disbursement = await this.prisma.disbursement.create({
        data: {
          invoiceId,
          vendorId: invoice.vendorId,
          disbursementNumber: `DISB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amountCents: invoice.totalCents,
          currency: "USD", // Default currency - TODO: get from funding bucket
          paymentMethod: paymentData.paymentMethod,
          // Note: Bank and Safe details would need additional schema fields if required
          status: DisbursementStatus.PENDING,
          scheduledDate: new Date(),
          initiatedBy: "system", // TODO: Get from authentication context
        },
      });

      logger.info('Disbursement created successfully', {
        disbursementId: disbursement.id,
        amountCents: disbursement.amountCents.toString(),
        paymentMethod: disbursement.paymentMethod,
      });

      return disbursement;
    } catch (error) {
      logger.error('Failed to create disbursement', { error, invoiceId });
      throw error;
    }
  }

  async executeBatchPayments(paymentRunId: string): Promise<BatchResult> {
    try {
      logger.info('Executing batch payments', { paymentRunId });

      // Get all pending disbursements for this payment run
      const disbursements = await this.prisma.disbursement.findMany({
        where: {
          paymentRunId,
          status: DisbursementStatus.PENDING,
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

      if (disbursements.length === 0) {
        throw new Error(`No pending disbursements found for payment run ${paymentRunId}`);
      }

      const results: DisbursementResult[] = [];
      let successCount = 0;
      let failCount = 0;
      const totalAmount = disbursements.reduce((sum, d) => sum + d.amountCents, BigInt(0));

      // Process each disbursement based on payment method
      for (const disbursement of disbursements) {
        try {
          let result: DisbursementResult;

          switch (disbursement.paymentMethod) {
            case PaymentMethod.ACH:
              const achResult = await this.processACHPayment(disbursement.id);
              result = {
                disbursementId: disbursement.id,
                success: achResult.success,
                bankReference: achResult.bankReference,
                error: achResult.error,
                executedAt: new Date(),
              };
              break;

            case PaymentMethod.USDC:
              const cryptoResult = await this.processUSDCPayment(disbursement.id);
              result = {
                disbursementId: disbursement.id,
                success: cryptoResult.success,
                txHash: cryptoResult.transactionHash,
                error: cryptoResult.error,
                executedAt: new Date(),
              };
              break;

            case PaymentMethod.SAFE_MULTISIG:
              const safeResult = await this.processSafeMultisigPayment(disbursement.id);
              result = {
                disbursementId: disbursement.id,
                success: safeResult.success,
                txHash: safeResult.safeTransactionHash,
                error: safeResult.error,
                executedAt: new Date(),
              };
              break;

            default:
              throw new Error(`Unsupported payment method: ${disbursement.paymentMethod}`);
          }

          results.push(result);
          result.success ? successCount++ : failCount++;

        } catch (error) {
          logger.error('Failed to process disbursement', {
            disbursementId: disbursement.id,
            error: error instanceof Error ? error.message : String(error),
          });

          results.push({
            disbursementId: disbursement.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            executedAt: new Date(),
          });
          failCount++;
        }
      }

      const batchResult: BatchResult = {
        paymentRunId,
        totalDisbursements: disbursements.length,
        successfulPayments: successCount,
        failedPayments: failCount,
        totalAmountCents: totalAmount,
        results,
      };

      logger.info('Batch payment execution completed', {
        paymentRunId,
        successCount,
        failCount,
        totalAmount: totalAmount.toString(),
      });

      return batchResult;
    } catch (error) {
      logger.error('Failed to execute batch payments', { error, paymentRunId });
      throw error;
    }
  }

  async processACHPayment(disbursementId: number): Promise<ACHResult> {
    try {
      logger.info('Processing ACH payment', { disbursementId });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
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

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      if (disbursement.paymentMethod !== PaymentMethod.ACH) {
        throw new Error(`Disbursement ${disbursementId} is not an ACH payment`);
      }

      // Update status to processing
      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.PROCESSING,
          executedDate: new Date(),
        },
      });

      // Simulate ACH processing (in real implementation, integrate with bank API)
      const achTransactionId = this.generateACHTransactionId();
      const bankReference = this.generateBankReference();

      // Simulate processing delay and potential failure
      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.CONFIRMED,
            txHash: achTransactionId,
            bankReference,
            executedDate: new Date(),
          },
        });

        // Update invoice status
        await this.prisma.invoice.update({
          where: { id: disbursement.invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });

        logger.info('ACH payment processed successfully', {
          disbursementId,
          achTransactionId,
          bankReference,
        });

        return {
          disbursementId,
          success: true,
          achTransactionId,
          bankReference,
          status: 'CONFIRMED',
        };
      } else {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.FAILED,
            failureReason: 'ACH transaction failed - insufficient funds or invalid account',
          },
        });

        return {
          disbursementId,
          success: false,
          achTransactionId,
          bankReference,
          status: 'FAILED',
          error: 'ACH transaction failed - insufficient funds or invalid account',
        };
      }
    } catch (error) {
      logger.error('Failed to process ACH payment', { error, disbursementId });

      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.FAILED,
          failureReason: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => {}); // Ignore update errors

      throw error;
    }
  }

  async processUSDCPayment(disbursementId: number): Promise<CryptoResult> {
    try {
      logger.info('Processing USDC payment', { disbursementId });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
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

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      if (disbursement.paymentMethod !== PaymentMethod.USDC) {
        throw new Error(`Disbursement ${disbursementId} is not a USDC payment`);
      }

      if (!disbursement.invoice.contract.vendor.cryptoAddress) {
        throw new Error(`No crypto address specified for vendor for USDC payment`);
      }

      // Update status to processing
      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.PROCESSING,
          executedDate: new Date(),
        },
      });

      // Simulate blockchain transaction (in real implementation, use viem/ethers)
      const transactionHash = this.generateTransactionHash();
      const blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
      const gasUsed = BigInt(21000 + Math.floor(Math.random() * 50000));
      const confirmations = 1;

      // Simulate blockchain success rate
      const success = Math.random() > 0.02; // 98% success rate

      if (success) {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.CONFIRMED,
            txHash: transactionHash,
            executedDate: new Date(),
          },
        });

        // Update invoice status
        await this.prisma.invoice.update({
          where: { id: disbursement.invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });

        logger.info('USDC payment processed successfully', {
          disbursementId,
          transactionHash,
          blockNumber,
          gasUsed: gasUsed.toString(),
        });

        return {
          disbursementId,
          success: true,
          transactionHash,
          blockNumber,
          gasUsed,
          confirmations,
        };
      } else {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.FAILED,
            failureReason: 'Transaction failed - insufficient gas or network error',
          },
        });

        return {
          disbursementId,
          success: false,
          transactionHash,
          confirmations: 0,
          error: 'Transaction failed - insufficient gas or network error',
        };
      }
    } catch (error) {
      logger.error('Failed to process USDC payment', { error, disbursementId });

      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.FAILED,
          failureReason: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => {}); // Ignore update errors

      throw error;
    }
  }

  async processSafeMultisigPayment(disbursementId: number): Promise<SafeResult> {
    try {
      logger.info('Processing Safe multisig payment', { disbursementId });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
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

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      if (disbursement.paymentMethod !== PaymentMethod.SAFE_MULTISIG) {
        throw new Error(`Disbursement ${disbursementId} is not a Safe multisig payment`);
      }

      // For Safe multisig, address would be stored in vendor's metadata or bankDetails
      const safeDetails = disbursement.invoice.contract.vendor.metadata as any;
      if (!safeDetails?.safeAddress) {
        throw new Error(`No Safe address specified for vendor for multisig payment`);
      }

      // Update status to processing
      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.PROCESSING,
          executedDate: new Date(),
        },
      });

      // Simulate Safe transaction creation and execution
      const safeTransactionHash = this.generateTransactionHash();
      const requiredSignatures = safeDetails?.safeThreshold || 2;
      const signatures = Math.floor(Math.random() * (requiredSignatures + 2));
      const executed = signatures >= requiredSignatures;

      if (executed) {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.CONFIRMED,
            txHash: safeTransactionHash,
            executedDate: new Date(),
          },
        });

        // Update invoice status
        await this.prisma.invoice.update({
          where: { id: disbursement.invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });

        logger.info('Safe multisig payment executed successfully', {
          disbursementId,
          safeTransactionHash,
          signatures,
          requiredSignatures,
        });

        return {
          disbursementId,
          success: true,
          safeTransactionHash,
          signatures,
          requiredSignatures,
          executed: true,
        };
      } else {
        await this.prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: DisbursementStatus.PENDING,
            txHash: safeTransactionHash,
          },
        });

        return {
          disbursementId,
          success: false,
          safeTransactionHash,
          signatures,
          requiredSignatures,
          executed: false,
          error: `Insufficient signatures: ${signatures}/${requiredSignatures}`,
        };
      }
    } catch (error) {
      logger.error('Failed to process Safe multisig payment', { error, disbursementId });

      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.FAILED,
          failureReason: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => {}); // Ignore update errors

      throw error;
    }
  }

  // Reconciliation
  async reconcilePayment(disbursementId: number, bankRef: string): Promise<void> {
    try {
      logger.info('Reconciling payment', { disbursementId, bankRef });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
      });

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      if (disbursement.status !== DisbursementStatus.CONFIRMED) {
        throw new Error(`Disbursement ${disbursementId} is not in confirmed status`);
      }

      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          bankReference: bankRef,
          reconciledDate: new Date(),
          status: DisbursementStatus.RECONCILED,
        },
      });

      logger.info('Payment reconciled successfully', { disbursementId, bankRef });
    } catch (error) {
      logger.error('Failed to reconcile payment', { error, disbursementId, bankRef });
      throw error;
    }
  }

  async matchBlockchainTransaction(disbursementId: number, txHash: string): Promise<void> {
    try {
      logger.info('Matching blockchain transaction', { disbursementId, txHash });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
      });

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      // Verify transaction hash matches
      if (disbursement.txHash !== txHash) {
        throw new Error(`Transaction hash mismatch: expected ${disbursement.txHash}, got ${txHash}`);
      }

      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          reconciledDate: new Date(),
          status: DisbursementStatus.RECONCILED,
        },
      });

      logger.info('Blockchain transaction matched successfully', { disbursementId, txHash });
    } catch (error) {
      logger.error('Failed to match blockchain transaction', { error, disbursementId, txHash });
      throw error;
    }
  }

  async generateReconciliationReport(dateRange: DateRange): Promise<ReconciliationReport> {
    try {
      logger.info('Generating reconciliation report', { dateRange });

      const disbursements = await this.prisma.disbursement.findMany({
        where: {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          status: {
            in: [DisbursementStatus.CONFIRMED, DisbursementStatus.RECONCILED],
          },
        },
        select: {
          id: true,
          amountCents: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          reconciledDate: true,
        },
      });

      const reconciledDisbursements = disbursements.filter(d => d.status === DisbursementStatus.RECONCILED);
      const unreconciledDisbursements = disbursements.filter(d => d.status === DisbursementStatus.CONFIRMED);

      const totalAmount = disbursements.reduce((sum, d) => sum + d.amountCents, BigInt(0));
      const reconciledAmount = reconciledDisbursements.reduce((sum, d) => sum + d.amountCents, BigInt(0));

      const report: ReconciliationReport = {
        dateRange,
        totalDisbursements: disbursements.length,
        reconciledCount: reconciledDisbursements.length,
        unreconciledCount: unreconciledDisbursements.length,
        totalAmount,
        reconciledAmount,
        unreconciledDisbursements: unreconciledDisbursements.map(d => ({
          id: d.id,
          amount: d.amountCents,
          paymentMethod: d.paymentMethod,
          status: d.status,
          createdAt: d.createdAt,
        })),
      };

      logger.info('Reconciliation report generated', {
        totalDisbursements: report.totalDisbursements,
        reconciledCount: report.reconciledCount,
        unreconciledCount: report.unreconciledCount,
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate reconciliation report', { error, dateRange });
      throw error;
    }
  }

  // Monitoring and alerts
  async checkPaymentStatus(disbursementId: number): Promise<PaymentStatus> {
    try {
      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
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

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      const status: PaymentStatus = {
        disbursementId,
        status: disbursement.status,
        paymentMethod: disbursement.paymentMethod,
        amountCents: disbursement.amountCents,
        recipient: disbursement.invoice.contract.vendor.name,
        txHash: disbursement.txHash || undefined,
        bankReference: disbursement.bankReference || undefined,
        lastChecked: new Date(),
        error: disbursement.failureReason || undefined,
      };

      return status;
    } catch (error) {
      logger.error('Failed to check payment status', { error, disbursementId });
      throw error;
    }
  }

  async retryFailedPayments(): Promise<RetryResult[]> {
    try {
      logger.info('Retrying failed payments');

      const failedDisbursements = await this.prisma.disbursement.findMany({
        where: {
          status: DisbursementStatus.FAILED,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const results: RetryResult[] = [];

      for (const disbursement of failedDisbursements) {
        try {
          // Reset status to pending for retry
          await this.prisma.disbursement.update({
            where: { id: disbursement.id },
            data: {
              status: DisbursementStatus.PENDING,
              failureReason: null,
              retryCount: (disbursement.retryCount || 0) + 1,
            },
          });

          results.push({
            disbursementId: disbursement.id,
            previousStatus: DisbursementStatus.FAILED,
            newStatus: DisbursementStatus.PENDING,
            success: true,
          });
        } catch (error) {
          results.push({
            disbursementId: disbursement.id,
            previousStatus: DisbursementStatus.FAILED,
            newStatus: DisbursementStatus.FAILED,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info('Failed payment retry completed', {
        attempted: failedDisbursements.length,
        successful: results.filter(r => r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to retry failed payments', { error });
      throw error;
    }
  }

  async sendPaymentNotifications(disbursementId: number): Promise<void> {
    try {
      logger.info('Sending payment notifications', { disbursementId });

      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
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

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      // In a real implementation, this would send email/SMS notifications
      // For now, we'll just log the notification
      const notificationData = {
        recipient: disbursement.invoice.contract.vendor.email,
        amountCents: disbursement.amountCents.toString(),
        paymentMethod: disbursement.paymentMethod,
        status: disbursement.status,
        reference: disbursement.disbursementNumber,
        txHash: disbursement.txHash,
      };

      logger.info('Payment notification sent', notificationData);

      // Update notification sent timestamp
      await this.prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to send payment notifications', { error, disbursementId });
      throw error;
    }
  }

  // Helper methods
  private async validatePaymentMethod(vendorId: number, paymentMethod: PaymentMethod): Promise<void> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    // Check if vendor supports this payment method
    if (paymentMethod === PaymentMethod.ACH && !vendor.bankDetails) {
      throw new Error('Vendor does not have ACH details configured');
    }

    if (paymentMethod === PaymentMethod.USDC && !vendor.cryptoAddress) {
      throw new Error('Vendor does not have crypto address configured');
    }

    if (paymentMethod === PaymentMethod.SAFE_MULTISIG && !vendor.cryptoAddress) {
      throw new Error('Vendor does not have crypto address configured');
    }
  }

  private determinePaymentType(paymentMethod: PaymentMethod): PaymentMethod {
    return paymentMethod;
  }

  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY-${timestamp}-${random}`.toUpperCase();
  }

  private generateACHTransactionId(): string {
    return `ACH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  }

  private generateBankReference(): string {
    return `BANK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  }

  private generateTransactionHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}