import { PrismaClient, Invoice, InvoiceType, InvoiceStatus, ApprovalStatus, FinanceRole, ApprovalDecision } from '@prisma/client';
import { logger } from '../utils/logger';

export interface InvoiceCreateRequest {
  contractId: number;
  vendorId: number;
  invoiceNumber: string;
  invoiceType?: InvoiceType;
  periodStart?: Date;
  periodEnd?: Date;
  billingDate?: Date;
  dueDate?: Date;
  subtotalCents: bigint;
  taxesCents?: bigint;
  witholdingsCents?: bigint;
  percentComplete?: number;
  cumulativeAmount?: bigint;
  previousAmountPaid?: bigint;
  attachments?: any;
  submittedBy: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvoiceCoding {
  budgetLineId: number;
  amountCents: bigint;
  percentage?: number;
  description?: string;
  accountCode?: string;
  costCenter?: string;
}

export interface ApprovalRouting {
  invoiceId: number;
  approvalTier: number;
  requiredRoles: FinanceRole[];
  requiredApprovers: number;
  currentApprovals: number;
  nextApprovers: string[];
  estimatedApprovalDate: Date;
}

export interface ApprovalData {
  approverAddress: string;
  approverRole: FinanceRole;
  decision: ApprovalDecision;
  approvalAmount?: bigint;
  notes?: string;
  conditions?: string;
}

export interface RejectionData {
  rejectedBy: string;
  reason: string;
  notes?: string;
}

export interface FundsCheck {
  invoiceId: number;
  contractId: number;
  requestedAmount: bigint;
  availableFunds: bigint;
  encumberedFunds: bigint;
  sufficientFunds: boolean;
  bucketBalances: Array<{
    bucketId: number;
    bucketName: string;
    availableAmount: bigint;
    allocatedToContract: bigint;
  }>;
}

export interface RetentionCalculation {
  invoiceId: number;
  subtotalAmount: bigint;
  retentionPercent: number;
  retentionAmount: bigint;
  netPayableAmount: bigint;
}

export interface ContractValidation {
  invoiceId: number;
  contractId: number;
  valid: boolean;
  contractAmount: bigint;
  invoicedToDate: bigint;
  thisInvoiceAmount: bigint;
  remainingContract: bigint;
  percentComplete: number;
  withinContractLimits: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentAuth {
  invoiceId: number;
  authorizedAmount: bigint;
  paymentMethod: string;
  scheduledDate: Date;
  authorizationNumber: string;
  approvals: Array<{
    role: FinanceRole;
    approver: string;
    approvedAt: Date;
  }>;
}

export class InvoiceService {
  constructor(private prisma: PrismaClient) {}

  // Invoice processing
  async createInvoice(invoiceData: InvoiceCreateRequest): Promise<Invoice> {
    try {
      // Calculate retention and totals
      const contract = await this.prisma.financeContract.findUnique({
        where: { id: invoiceData.contractId }
      });

      if (!contract) {
        throw new Error(`Contract ${invoiceData.contractId} not found`);
      }

      const retentionCents = (invoiceData.subtotalCents * BigInt(contract.retentionPercent)) / 100n;
      const totalCents = invoiceData.subtotalCents + (invoiceData.taxesCents || 0n);
      const netPayableCents = totalCents - retentionCents - (invoiceData.witholdingsCents || 0n);

      const invoice = await this.prisma.invoice.create({
        data: {
          contractId: invoiceData.contractId,
          vendorId: invoiceData.vendorId,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceType: invoiceData.invoiceType || InvoiceType.PROGRESS,
          periodStart: invoiceData.periodStart,
          periodEnd: invoiceData.periodEnd,
          billingDate: invoiceData.billingDate || new Date(),
          dueDate: invoiceData.dueDate,
          subtotalCents: invoiceData.subtotalCents,
          taxesCents: invoiceData.taxesCents || 0n,
          retentionCents,
          witholdingsCents: invoiceData.witholdingsCents || 0n,
          totalCents,
          netPayableCents,
          percentComplete: invoiceData.percentComplete,
          cumulativeAmount: invoiceData.cumulativeAmount,
          previousAmountPaid: invoiceData.previousAmountPaid,
          status: InvoiceStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          attachments: invoiceData.attachments,
          submittedBy: invoiceData.submittedBy
        }
      });

      logger.info(`Created invoice ${invoice.id}`, { 
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        contractId: invoiceData.contractId,
        vendorId: invoiceData.vendorId,
        totalAmount: totalCents.toString(),
        submittedBy: invoiceData.submittedBy 
      });

      return invoice;
    } catch (error) {
      logger.error(`Failed to create invoice`, { error, invoiceData });
      throw error;
    }
  }

  async submitInvoice(invoiceId: number): Promise<void> {
    try {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.SUBMITTED,
          approvalStatus: ApprovalStatus.PENDING
        }
      });

      logger.info(`Submitted invoice ${invoiceId}`, { invoiceId });
    } catch (error) {
      logger.error(`Failed to submit invoice ${invoiceId}`, { error, invoiceId });
      throw error;
    }
  }

  async validateInvoice(invoiceId: number): Promise<ValidationResult> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          contract: true,
          vendor: true,
          invoiceCoding: {
            include: { budgetLine: true }
          }
        }
      });

      if (!invoice) {
        return {
          valid: false,
          errors: [`Invoice ${invoiceId} not found`],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate vendor status
      if (invoice.vendor.status !== 'APPROVED') {
        errors.push(`Vendor ${invoice.vendor.name} is not approved`);
      }

      if (invoice.vendor.kycStatus !== 'APPROVED') {
        errors.push(`Vendor ${invoice.vendor.name} KYC is not approved`);
      }

      // Validate contract status
      if (invoice.contract.status !== 'SIGNED') {
        errors.push(`Contract ${invoice.contract.contractNumber} is not signed`);
      }

      // Validate invoice coding
      if (invoice.invoiceCoding.length === 0) {
        errors.push('Invoice must be coded to at least one budget line');
      } else {
        const totalCoded = invoice.invoiceCoding.reduce((sum, coding) => sum + coding.amountCents, 0n);
        if (totalCoded !== invoice.subtotalCents) {
          errors.push(`Invoice coding total (${totalCoded}) does not match subtotal (${invoice.subtotalCents})`);
        }
      }

      // Validate contract amounts
      const contractValidation = await this.validateAgainstContract(invoiceId);
      if (!contractValidation.valid) {
        errors.push(...contractValidation.errors);
        warnings.push(...contractValidation.warnings);
      }

      // Check due date
      if (invoice.dueDate && invoice.dueDate < new Date()) {
        warnings.push('Invoice due date is in the past');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error(`Failed to validate invoice ${invoiceId}`, { error, invoiceId });
      return {
        valid: false,
        errors: ['Validation failed due to system error'],
        warnings: []
      };
    }
  }

  async codeInvoiceToWBS(invoiceId: number, coding: InvoiceCoding[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete existing coding
        await tx.invoiceCoding.deleteMany({
          where: { invoiceId }
        });

        // Create new coding entries
        for (const code of coding) {
          await tx.invoiceCoding.create({
            data: {
              invoiceId,
              budgetLineId: code.budgetLineId,
              amountCents: code.amountCents,
              percentage: code.percentage,
              description: code.description,
              accountCode: code.accountCode,
              costCenter: code.costCenter
            }
          });
        }
      });

      logger.info(`Coded invoice ${invoiceId} to WBS`, { 
        invoiceId, 
        codingCount: coding.length,
        totalAmount: coding.reduce((sum, c) => sum + c.amountCents, 0n).toString()
      });
    } catch (error) {
      logger.error(`Failed to code invoice ${invoiceId} to WBS`, { error, invoiceId, coding });
      throw error;
    }
  }

  // Approval workflow
  async routeForApproval(invoiceId: number): Promise<ApprovalRouting> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          contract: {
            include: {
              project: {
                include: { approvalMatrix: true }
              }
            }
          }
        }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const approvalMatrix = invoice.contract.project.approvalMatrix;
      if (!approvalMatrix) {
        throw new Error(`No approval matrix configured for project ${invoice.contract.projectId}`);
      }

      // Determine approval tier based on amount
      let approvalTier = 1;
      let requiredRoles: FinanceRole[] = JSON.parse(approvalMatrix.tier1RequiredRoles as string);

      if (invoice.netPayableCents > BigInt(approvalMatrix.tier2MaxAmount)) {
        approvalTier = 3;
        requiredRoles = JSON.parse(approvalMatrix.tier3RequiredRoles as string);
      } else if (invoice.netPayableCents > BigInt(approvalMatrix.tier1MaxAmount)) {
        approvalTier = 2;
        requiredRoles = JSON.parse(approvalMatrix.tier2RequiredRoles as string);
      }

      // Get current approvals
      const currentApprovals = await this.prisma.financeApproval.count({
        where: {
          invoiceId,
          decision: ApprovalDecision.APPROVED
        }
      });

      // Calculate estimated approval date (business logic)
      const estimatedApprovalDate = new Date();
      estimatedApprovalDate.setDate(estimatedApprovalDate.getDate() + (approvalTier * 2)); // 2 days per tier

      const routing: ApprovalRouting = {
        invoiceId,
        approvalTier,
        requiredRoles,
        requiredApprovers: requiredRoles.length,
        currentApprovals,
        nextApprovers: [], // TODO: Get actual approver addresses from RBAC
        estimatedApprovalDate
      };

      logger.info(`Routed invoice ${invoiceId} for approval`, { 
        invoiceId,
        approvalTier,
        requiredRoles,
        amount: invoice.netPayableCents.toString()
      });

      return routing;
    } catch (error) {
      logger.error(`Failed to route invoice ${invoiceId} for approval`, { error, invoiceId });
      throw error;
    }
  }

  async approveInvoice(invoiceId: number, approval: ApprovalData): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create approval record
        await tx.financeApproval.create({
          data: {
            targetType: 'INVOICE',
            targetId: invoiceId,
            invoiceId,
            approverRole: approval.approverRole,
            approverAddress: approval.approverAddress,
            decision: approval.decision,
            approvalAmount: approval.approvalAmount,
            notes: approval.notes,
            conditions: approval.conditions,
            decidedAt: new Date()
          }
        });

        // Check if all required approvals are complete
        const routing = await this.routeForApproval(invoiceId);
        if (routing.currentApprovals + 1 >= routing.requiredApprovers) {
          // All approvals complete - update invoice status
          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.APPROVED,
              approvalStatus: ApprovalStatus.APPROVED,
              approvedBy: approval.approverAddress,
              approvedAt: new Date()
            }
          });

          // TODO: Trigger funds encumbrance via LedgerService
          // const ledgerService = new LedgerService(this.prisma);
          // await ledgerService.encumberFunds(invoiceId, invoice.netPayableCents);
        }
      });

      logger.info(`Approved invoice ${invoiceId}`, { 
        invoiceId,
        approverAddress: approval.approverAddress,
        approverRole: approval.approverRole,
        decision: approval.decision
      });
    } catch (error) {
      logger.error(`Failed to approve invoice ${invoiceId}`, { error, invoiceId, approval });
      throw error;
    }
  }

  async rejectInvoice(invoiceId: number, rejection: RejectionData): Promise<void> {
    try {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.REJECTED,
          approvalStatus: ApprovalStatus.REJECTED,
          rejectionReason: rejection.reason,
          reviewNotes: rejection.notes,
          reviewedBy: rejection.rejectedBy,
          reviewedAt: new Date()
        }
      });

      logger.info(`Rejected invoice ${invoiceId}`, { 
        invoiceId,
        rejectedBy: rejection.rejectedBy,
        reason: rejection.reason
      });
    } catch (error) {
      logger.error(`Failed to reject invoice ${invoiceId}`, { error, invoiceId, rejection });
      throw error;
    }
  }

  async scheduleForPayment(invoiceId: number, paymentDate: Date): Promise<void> {
    try {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.SCHEDULED,
          scheduledPayDate: paymentDate
        }
      });

      logger.info(`Scheduled invoice ${invoiceId} for payment`, { 
        invoiceId,
        paymentDate: paymentDate.toISOString()
      });
    } catch (error) {
      logger.error(`Failed to schedule invoice ${invoiceId} for payment`, { error, invoiceId, paymentDate });
      throw error;
    }
  }

  // Financial validation
  async checkFundsAvailability(invoiceId: number): Promise<FundsCheck> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          contract: {
            include: {
              fundingBucket: true,
              budgetAllocations: {
                include: { budgetLine: true }
              }
            }
          }
        }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const bucket = invoice.contract.fundingBucket;
      const requestedAmount = invoice.netPayableCents;
      const sufficientFunds = bucket.availableCents >= requestedAmount;

      const bucketBalances = [{
        bucketId: bucket.id,
        bucketName: bucket.name,
        availableAmount: bucket.availableCents,
        allocatedToContract: invoice.contract.currentAmount
      }];

      const fundsCheck: FundsCheck = {
        invoiceId,
        contractId: invoice.contractId,
        requestedAmount,
        availableFunds: bucket.availableCents,
        encumberedFunds: bucket.encumberedCents,
        sufficientFunds,
        bucketBalances
      };

      logger.info(`Checked funds availability for invoice ${invoiceId}`, { 
        invoiceId,
        requestedAmount: requestedAmount.toString(),
        availableFunds: bucket.availableCents.toString(),
        sufficientFunds
      });

      return fundsCheck;
    } catch (error) {
      logger.error(`Failed to check funds availability for invoice ${invoiceId}`, { error, invoiceId });
      throw error;
    }
  }

  async calculateRetention(invoiceId: number): Promise<RetentionCalculation> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { contract: true }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const retentionPercent = invoice.contract.retentionPercent;
      const retentionAmount = (invoice.subtotalCents * BigInt(retentionPercent)) / 100n;
      const netPayableAmount = invoice.totalCents - retentionAmount - invoice.witholdingsCents;

      const calculation: RetentionCalculation = {
        invoiceId,
        subtotalAmount: invoice.subtotalCents,
        retentionPercent,
        retentionAmount,
        netPayableAmount
      };

      logger.info(`Calculated retention for invoice ${invoiceId}`, { 
        invoiceId,
        retentionPercent,
        retentionAmount: retentionAmount.toString(),
        netPayableAmount: netPayableAmount.toString()
      });

      return calculation;
    } catch (error) {
      logger.error(`Failed to calculate retention for invoice ${invoiceId}`, { error, invoiceId });
      throw error;
    }
  }

  async validateAgainstContract(invoiceId: number): Promise<ContractValidation> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          contract: {
            include: {
              invoices: {
                where: { status: { in: ['APPROVED', 'PAID'] } }
              }
            }
          }
        }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const contract = invoice.contract;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Calculate amounts
      const invoicedToDate = contract.invoices
        .filter(inv => inv.id !== invoiceId)
        .reduce((sum, inv) => sum + inv.netPayableCents, 0n);
      
      const thisInvoiceAmount = invoice.netPayableCents;
      const totalInvoiced = invoicedToDate + thisInvoiceAmount;
      const remainingContract = contract.currentAmount - totalInvoiced;
      const percentComplete = Number((totalInvoiced * 100n) / contract.currentAmount);

      // Validations
      if (totalInvoiced > contract.currentAmount) {
        errors.push(`Total invoiced amount (${totalInvoiced}) exceeds contract amount (${contract.currentAmount})`);
      }

      if (totalInvoiced > contract.notToExceed) {
        errors.push(`Total invoiced amount (${totalInvoiced}) exceeds not-to-exceed amount (${contract.notToExceed})`);
      }

      if (invoice.percentComplete && Math.abs(invoice.percentComplete - percentComplete) > 10) {
        warnings.push(`Invoice percent complete (${invoice.percentComplete}%) differs significantly from calculated percent (${percentComplete}%)`);
      }

      if (remainingContract < 0n) {
        errors.push(`Remaining contract amount is negative: ${remainingContract}`);
      }

      const validation: ContractValidation = {
        invoiceId,
        contractId: contract.id,
        valid: errors.length === 0,
        contractAmount: contract.currentAmount,
        invoicedToDate,
        thisInvoiceAmount,
        remainingContract,
        percentComplete,
        withinContractLimits: totalInvoiced <= contract.currentAmount,
        errors,
        warnings
      };

      logger.info(`Validated invoice ${invoiceId} against contract`, { 
        invoiceId,
        contractId: contract.id,
        valid: validation.valid,
        percentComplete,
        remainingContract: remainingContract.toString()
      });

      return validation;
    } catch (error) {
      logger.error(`Failed to validate invoice ${invoiceId} against contract`, { error, invoiceId });
      throw error;
    }
  }

  async generatePaymentAuthorization(invoiceId: number): Promise<PaymentAuth> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          approvals: {
            where: { decision: ApprovalDecision.APPROVED }
          }
        }
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      if (invoice.status !== InvoiceStatus.APPROVED) {
        throw new Error(`Invoice ${invoiceId} is not approved`);
      }

      // Generate authorization number
      const authNumber = `AUTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Calculate payment date (default to 30 days from now)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      const approvals = invoice.approvals.map(approval => ({
        role: approval.approverRole,
        approver: approval.approverAddress,
        approvedAt: approval.decidedAt!
      }));

      const paymentAuth: PaymentAuth = {
        invoiceId,
        authorizedAmount: invoice.netPayableCents,
        paymentMethod: 'ACH', // TODO: Get from vendor preferences
        scheduledDate,
        authorizationNumber: authNumber,
        approvals
      };

      logger.info(`Generated payment authorization for invoice ${invoiceId}`, { 
        invoiceId,
        authorizationNumber: authNumber,
        authorizedAmount: invoice.netPayableCents.toString(),
        approvalCount: approvals.length
      });

      return paymentAuth;
    } catch (error) {
      logger.error(`Failed to generate payment authorization for invoice ${invoiceId}`, { error, invoiceId });
      throw error;
    }
  }
}