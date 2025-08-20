import { PrismaClient, LedgerEntryType, LedgerReferenceType, FundingBucket, LedgerEntry } from '@orenna/db';
import { logger } from '../utils/logger';

export interface ReconciliationResult {
  bucketId: number;
  expectedBalance: bigint;
  actualBalance: bigint;
  discrepancy: bigint;
  reconciled: boolean;
  entries: LedgerEntry[];
}

export interface LedgerReport {
  bucketId: number;
  startDate: Date;
  endDate: Date;
  openingBalance: bigint;
  closingBalance: bigint;
  totalDebits: bigint;
  totalCredits: bigint;
  entries: LedgerEntry[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface LedgerOperationResult {
  success: boolean;
  entryNumber: string;
  balanceAfter: bigint;
  error?: string;
}

export class LedgerService {
  constructor(private prisma: PrismaClient) {}

  // Core operations following accounting principles
  async commitFunds(contractId: number, amount: bigint): Promise<LedgerOperationResult> {
    try {
      // Get contract details to find funding bucket
      const contract = await this.prisma.financeContract.findUnique({
        where: { id: contractId },
        include: { fundingBucket: true }
      });

      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Check funds availability
      const available = await this.validateFundsAvailability(contract.fundingBucketId, amount);
      if (!available) {
        throw new Error(`Insufficient funds in bucket ${contract.fundingBucketId}`);
      }

      // Generate unique entry number
      const entryNumber = await this.generateEntryNumber('COMMIT');

      // Create double-entry: Debit Available, Credit Committed
      const result = await this.prisma.$transaction(async (tx) => {
        // Update funding bucket
        const updatedBucket = await tx.fundingBucket.update({
          where: { id: contract.fundingBucketId },
          data: {
            availableCents: { decrement: amount },
            committedCents: { increment: amount }
          }
        });

        // Create ledger entry
        const entry = await tx.ledgerEntry.create({
          data: {
            entryNumber,
            entryType: LedgerEntryType.COMMIT,
            debitCents: amount,
            creditCents: 0n,
            referenceType: LedgerReferenceType.CONTRACT,
            referenceId: contractId,
            fundingBucketId: contract.fundingBucketId,
            description: `Commit funds for contract ${contract.contractNumber}`,
            balanceAfterCents: updatedBucket.availableCents,
            createdBy: 'system' // TODO: Get from context
          }
        });

        return {
          success: true,
          entryNumber: entry.entryNumber,
          balanceAfter: updatedBucket.availableCents
        };
      });

      logger.info(`Committed ${amount} for contract ${contractId}`, { 
        contractId, 
        amount: amount.toString(),
        entryNumber: result.entryNumber 
      });

      return result;
    } catch (error) {
      logger.error(`Failed to commit funds for contract ${contractId}`, { error, contractId, amount: amount.toString() });
      return {
        success: false,
        entryNumber: '',
        balanceAfter: 0n,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async encumberFunds(invoiceId: number, amount: bigint): Promise<LedgerOperationResult> {
    try {
      // Get invoice details to find contract and funding bucket
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { 
          contract: {
            include: { fundingBucket: true }
          }
        }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Generate unique entry number
      const entryNumber = await this.generateEntryNumber('ENCUMBER');

      // Create double-entry: Debit Committed, Credit Encumbered
      const result = await this.prisma.$transaction(async (tx) => {
        // Update funding bucket
        const updatedBucket = await tx.fundingBucket.update({
          where: { id: invoice.contract.fundingBucketId },
          data: {
            committedCents: { decrement: amount },
            encumberedCents: { increment: amount }
          }
        });

        // Create ledger entry
        const entry = await tx.ledgerEntry.create({
          data: {
            entryNumber,
            entryType: LedgerEntryType.ENCUMBER,
            debitCents: amount,
            creditCents: 0n,
            referenceType: LedgerReferenceType.INVOICE,
            referenceId: invoiceId,
            fundingBucketId: invoice.contract.fundingBucketId,
            description: `Encumber funds for invoice ${invoice.invoiceNumber}`,
            balanceAfterCents: updatedBucket.committedCents,
            createdBy: 'system' // TODO: Get from context
          }
        });

        return {
          success: true,
          entryNumber: entry.entryNumber,
          balanceAfter: updatedBucket.committedCents
        };
      });

      logger.info(`Encumbered ${amount} for invoice ${invoiceId}`, { 
        invoiceId, 
        amount: amount.toString(),
        entryNumber: result.entryNumber 
      });

      return result;
    } catch (error) {
      logger.error(`Failed to encumber funds for invoice ${invoiceId}`, { error, invoiceId, amount: amount.toString() });
      return {
        success: false,
        entryNumber: '',
        balanceAfter: 0n,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async disburseFunds(disbursementId: number, amount: bigint): Promise<LedgerOperationResult> {
    try {
      // Get disbursement details
      const disbursement = await this.prisma.disbursement.findUnique({
        where: { id: disbursementId },
        include: { 
          invoice: {
            include: {
              contract: {
                include: { fundingBucket: true }
              }
            }
          }
        }
      });

      if (!disbursement) {
        throw new Error(`Disbursement ${disbursementId} not found`);
      }

      // Generate unique entry number
      const entryNumber = await this.generateEntryNumber('DISBURSE');

      // Create double-entry: Debit Encumbered, Credit Disbursed
      const result = await this.prisma.$transaction(async (tx) => {
        // Update funding bucket
        const updatedBucket = await tx.fundingBucket.update({
          where: { id: disbursement.invoice.contract.fundingBucketId },
          data: {
            encumberedCents: { decrement: amount },
            disbursedCents: { increment: amount }
          }
        });

        // Create ledger entry
        const entry = await tx.ledgerEntry.create({
          data: {
            entryNumber,
            entryType: LedgerEntryType.DISBURSE,
            debitCents: amount,
            creditCents: 0n,
            referenceType: LedgerReferenceType.DISBURSEMENT,
            referenceId: disbursementId,
            disbursementId,
            fundingBucketId: disbursement.invoice.contract.fundingBucketId,
            description: `Disburse funds for disbursement ${disbursement.disbursementNumber}`,
            balanceAfterCents: updatedBucket.encumberedCents,
            createdBy: 'system' // TODO: Get from context
          }
        });

        return {
          success: true,
          entryNumber: entry.entryNumber,
          balanceAfter: updatedBucket.encumberedCents
        };
      });

      logger.info(`Disbursed ${amount} for disbursement ${disbursementId}`, { 
        disbursementId, 
        amount: amount.toString(),
        entryNumber: result.entryNumber 
      });

      return result;
    } catch (error) {
      logger.error(`Failed to disburse funds for disbursement ${disbursementId}`, { error, disbursementId, amount: amount.toString() });
      return {
        success: false,
        entryNumber: '',
        balanceAfter: 0n,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async releaseFunds(verificationGateId: number, amount: bigint): Promise<LedgerOperationResult> {
    try {
      // Get verification gate details
      const gate = await this.prisma.verificationGate.findUnique({
        where: { id: verificationGateId },
        include: { project: true }
      });

      if (!gate) {
        throw new Error(`Verification gate ${verificationGateId} not found`);
      }

      // Find project's funding bucket (assuming main Lift Forward bucket)
      const bucket = await this.prisma.fundingBucket.findFirst({
        where: { 
          projectId: gate.projectId,
          type: 'LIFT_FORWARD'
        }
      });

      if (!bucket) {
        throw new Error(`No funding bucket found for project ${gate.projectId}`);
      }

      // Generate unique entry number
      const entryNumber = await this.generateEntryNumber('RELEASE');

      // Create double-entry: Debit Reserved, Credit Available
      const result = await this.prisma.$transaction(async (tx) => {
        // Update funding bucket
        const updatedBucket = await tx.fundingBucket.update({
          where: { id: bucket.id },
          data: {
            reservedCents: { decrement: amount },
            availableCents: { increment: amount }
          }
        });

        // Create ledger entry
        const entry = await tx.ledgerEntry.create({
          data: {
            entryNumber,
            entryType: LedgerEntryType.RELEASE,
            debitCents: amount,
            creditCents: 0n,
            referenceType: LedgerReferenceType.OTHER,
            referenceId: verificationGateId,
            fundingBucketId: bucket.id,
            description: `Release retention for verification gate ${gate.gateName}`,
            balanceAfterCents: updatedBucket.availableCents,
            createdBy: 'system' // TODO: Get from context
          }
        });

        return {
          success: true,
          entryNumber: entry.entryNumber,
          balanceAfter: updatedBucket.availableCents
        };
      });

      logger.info(`Released ${amount} for verification gate ${verificationGateId}`, { 
        verificationGateId, 
        amount: amount.toString(),
        entryNumber: result.entryNumber 
      });

      return result;
    } catch (error) {
      logger.error(`Failed to release funds for verification gate ${verificationGateId}`, { error, verificationGateId, amount: amount.toString() });
      return {
        success: false,
        entryNumber: '',
        balanceAfter: 0n,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Integrity and validation
  async validateFundsAvailability(bucketId: number, amount: bigint): Promise<boolean> {
    try {
      const bucket = await this.prisma.fundingBucket.findUnique({
        where: { id: bucketId }
      });

      if (!bucket) {
        return false;
      }

      return bucket.availableCents >= amount;
    } catch (error) {
      logger.error(`Failed to validate funds availability for bucket ${bucketId}`, { error, bucketId, amount: amount.toString() });
      return false;
    }
  }

  async reconcileBucket(bucketId: number): Promise<ReconciliationResult> {
    try {
      const bucket = await this.prisma.fundingBucket.findUnique({
        where: { id: bucketId }
      });

      if (!bucket) {
        throw new Error(`Funding bucket ${bucketId} not found`);
      }

      // Get all ledger entries for this bucket
      const entries = await this.prisma.ledgerEntry.findMany({
        where: { fundingBucketId: bucketId },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate actual balance from ledger entries
      let actualBalance = 0n;
      for (const entry of entries) {
        actualBalance += entry.debitCents - entry.creditCents;
      }

      // Expected balance from bucket fields
      const expectedBalance = bucket.availableCents + bucket.reservedCents + 
                             bucket.committedCents + bucket.encumberedCents + 
                             bucket.disbursedCents;

      const discrepancy = expectedBalance - actualBalance;
      const reconciled = discrepancy === 0n;

      logger.info(`Reconciled bucket ${bucketId}`, { 
        bucketId, 
        expectedBalance: expectedBalance.toString(),
        actualBalance: actualBalance.toString(),
        discrepancy: discrepancy.toString(),
        reconciled 
      });

      return {
        bucketId,
        expectedBalance,
        actualBalance,
        discrepancy,
        reconciled,
        entries
      };
    } catch (error) {
      logger.error(`Failed to reconcile bucket ${bucketId}`, { error, bucketId });
      throw error;
    }
  }

  async generateLedgerReport(bucketId: number, dateRange: DateRange): Promise<LedgerReport> {
    try {
      // Get opening balance (balance at start date)
      const openingEntries = await this.prisma.ledgerEntry.findMany({
        where: {
          fundingBucketId: bucketId,
          createdAt: { lt: dateRange.startDate }
        },
        orderBy: { createdAt: 'asc' }
      });

      let openingBalance = 0n;
      for (const entry of openingEntries) {
        openingBalance += entry.debitCents - entry.creditCents;
      }

      // Get entries within date range
      const entries = await this.prisma.ledgerEntry.findMany({
        where: {
          fundingBucketId: bucketId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate totals
      let totalDebits = 0n;
      let totalCredits = 0n;
      let closingBalance = openingBalance;

      for (const entry of entries) {
        totalDebits += entry.debitCents;
        totalCredits += entry.creditCents;
        closingBalance += entry.debitCents - entry.creditCents;
      }

      logger.info(`Generated ledger report for bucket ${bucketId}`, { 
        bucketId, 
        dateRange,
        openingBalance: openingBalance.toString(),
        closingBalance: closingBalance.toString(),
        totalDebits: totalDebits.toString(),
        totalCredits: totalCredits.toString(),
        entryCount: entries.length
      });

      return {
        bucketId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        openingBalance,
        closingBalance,
        totalDebits,
        totalCredits,
        entries
      };
    } catch (error) {
      logger.error(`Failed to generate ledger report for bucket ${bucketId}`, { error, bucketId, dateRange });
      throw error;
    }
  }

  // Helper methods
  private async generateEntryNumber(type: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${type}-${timestamp}-${random}`;
  }
}