import { PrismaClient, FinanceContract, ChangeOrder, ContractType, ContractStatus, ApprovalStatus, ChangeOrderReason, ChangeOrderCategory, ChangeOrderStatus } from '@orenna/db';
import { logger } from '../utils/logger';

export interface ContractCreateRequest {
  projectId: number;
  vendorId: number;
  fundingBucketId: number;
  contractNumber: string;
  contractType: ContractType;
  title: string;
  description?: string;
  originalAmount: bigint;
  notToExceed: bigint;
  paymentTerms?: string;
  retentionPercent?: number;
  startDate?: Date;
  endDate?: Date;
  milestones?: any;
  createdBy: string;
}

export interface BudgetAllocation {
  budgetLineId: number;
  allocatedAmount: bigint;
  percentage?: number;
}

export interface ApprovalData {
  approvedBy: string;
  notes?: string;
}

export interface ChangeOrderRequest {
  changeOrderNumber: string;
  title: string;
  description: string;
  deltaAmount: bigint;
  deltaTimedays?: number;
  newEndDate?: Date;
  reason: ChangeOrderReason;
  category: ChangeOrderCategory;
  justification: string;
  requestedBy: string;
}

export interface ChangeOrderImpact {
  contractId: number;
  currentAmount: bigint;
  newAmount: bigint;
  deltaAmount: bigint;
  currentEndDate?: Date;
  newEndDate?: Date;
  deltaTimedays?: number;
  budgetImpact: Array<{
    budgetLineId: number;
    budgetLineName: string;
    currentAllocation: bigint;
    newAllocation: bigint;
    deltaAllocation: bigint;
  }>;
  fundsAvailable: boolean;
  approvalRequired: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RetentionCalculation {
  contractId: number;
  contractAmount: bigint;
  retentionPercent: number;
  retentionAmount: bigint;
  currentRetentionHeld: bigint;
  retentionDue: bigint;
}

export class ContractService {
  constructor(private prisma: PrismaClient) {}

  // Contract lifecycle
  async createContract(contractData: ContractCreateRequest): Promise<FinanceContract> {
    try {
      const contract = await this.prisma.financeContract.create({
        data: {
          projectId: contractData.projectId,
          vendorId: contractData.vendorId,
          fundingBucketId: contractData.fundingBucketId,
          contractNumber: contractData.contractNumber,
          contractType: contractData.contractType,
          title: contractData.title,
          description: contractData.description,
          originalAmount: contractData.originalAmount,
          currentAmount: contractData.originalAmount,
          notToExceed: contractData.notToExceed,
          paymentTerms: contractData.paymentTerms,
          retentionPercent: contractData.retentionPercent || 10,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
          milestones: contractData.milestones,
          status: ContractStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          createdBy: contractData.createdBy
        }
      });

      logger.info(`Created contract ${contract.id}`, { 
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        projectId: contractData.projectId,
        vendorId: contractData.vendorId,
        amount: contractData.originalAmount.toString(),
        createdBy: contractData.createdBy 
      });

      return contract;
    } catch (error) {
      logger.error(`Failed to create contract`, { error, contractData });
      throw error;
    }
  }

  async allocateBudget(contractId: number, allocations: BudgetAllocation[]): Promise<void> {
    try {
      // Validate allocations first
      const validation = await this.validateBudgetAllocation(allocations);
      if (!validation.valid) {
        throw new Error(`Budget allocation validation failed: ${validation.errors.join(', ')}`);
      }

      await this.prisma.$transaction(async (tx) => {
        // Delete existing allocations
        await tx.contractBudgetAllocation.deleteMany({
          where: { contractId }
        });

        // Create new allocations
        for (const allocation of allocations) {
          await tx.contractBudgetAllocation.create({
            data: {
              contractId,
              budgetLineId: allocation.budgetLineId,
              allocatedAmount: allocation.allocatedAmount,
              percentage: allocation.percentage
            }
          });

          // Update budget line committed amount
          await tx.budgetLine.update({
            where: { id: allocation.budgetLineId },
            data: {
              committedAmount: { increment: allocation.allocatedAmount }
            }
          });
        }
      });

      logger.info(`Allocated budget for contract ${contractId}`, { 
        contractId, 
        allocationCount: allocations.length,
        totalAllocated: allocations.reduce((sum, a) => sum + a.allocatedAmount, 0n).toString()
      });
    } catch (error) {
      logger.error(`Failed to allocate budget for contract ${contractId}`, { error, contractId, allocations });
      throw error;
    }
  }

  async submitForApproval(contractId: number): Promise<void> {
    try {
      await this.prisma.financeContract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.PENDING_APPROVAL,
          approvalStatus: ApprovalStatus.PENDING
        }
      });

      logger.info(`Submitted contract ${contractId} for approval`, { contractId });
    } catch (error) {
      logger.error(`Failed to submit contract ${contractId} for approval`, { error, contractId });
      throw error;
    }
  }

  async approveContract(contractId: number, approverData: ApprovalData): Promise<void> {
    try {
      const contract = await this.prisma.financeContract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.APPROVED,
          approvalStatus: ApprovalStatus.APPROVED,
          approvedBy: approverData.approvedBy,
          approvedAt: new Date()
        }
      });

      // TODO: Trigger funds commitment via LedgerService
      // const ledgerService = new LedgerService(this.prisma);
      // await ledgerService.commitFunds(contractId, contract.currentAmount);

      logger.info(`Approved contract ${contractId}`, { 
        contractId,
        approvedBy: approverData.approvedBy,
        amount: contract.currentAmount.toString()
      });
    } catch (error) {
      logger.error(`Failed to approve contract ${contractId}`, { error, contractId, approverData });
      throw error;
    }
  }

  async executeContract(contractId: number): Promise<void> {
    try {
      await this.prisma.financeContract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.SIGNED,
          signedAt: new Date()
        }
      });

      logger.info(`Executed contract ${contractId}`, { contractId });
    } catch (error) {
      logger.error(`Failed to execute contract ${contractId}`, { error, contractId });
      throw error;
    }
  }

  // Change order management
  async createChangeOrder(contractId: number, changeData: ChangeOrderRequest): Promise<ChangeOrder> {
    try {
      const contract = await this.prisma.financeContract.findUnique({
        where: { id: contractId }
      });

      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      const newContractTotal = contract.currentAmount + changeData.deltaAmount;

      const changeOrder = await this.prisma.changeOrder.create({
        data: {
          contractId,
          changeOrderNumber: changeData.changeOrderNumber,
          title: changeData.title,
          description: changeData.description,
          deltaAmount: changeData.deltaAmount,
          newContractTotal,
          deltaTimedays: changeData.deltaTimedays,
          newEndDate: changeData.newEndDate,
          reason: changeData.reason,
          category: changeData.category,
          justification: changeData.justification,
          status: ChangeOrderStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          requestedBy: changeData.requestedBy
        }
      });

      logger.info(`Created change order ${changeOrder.id}`, { 
        changeOrderId: changeOrder.id,
        contractId,
        changeOrderNumber: changeData.changeOrderNumber,
        deltaAmount: changeData.deltaAmount.toString(),
        requestedBy: changeData.requestedBy 
      });

      return changeOrder;
    } catch (error) {
      logger.error(`Failed to create change order for contract ${contractId}`, { error, contractId, changeData });
      throw error;
    }
  }

  async calculateImpact(changeOrderId: number): Promise<ChangeOrderImpact> {
    try {
      const changeOrder = await this.prisma.changeOrder.findUnique({
        where: { id: changeOrderId },
        include: {
          contract: {
            include: {
              budgetAllocations: {
                include: { budgetLine: true }
              },
              fundingBucket: true
            }
          }
        }
      });

      if (!changeOrder) {
        throw new Error(`Change order ${changeOrderId} not found`);
      }

      const contract = changeOrder.contract;
      const newAmount = contract.currentAmount + changeOrder.deltaAmount;

      // Calculate budget impact
      const budgetImpact = contract.budgetAllocations.map(allocation => {
        // Proportional allocation of change order amount
        const proportion = Number(allocation.allocatedAmount) / Number(contract.currentAmount);
        const deltaAllocation = BigInt(Math.floor(Number(changeOrder.deltaAmount) * proportion));
        
        return {
          budgetLineId: allocation.budgetLineId,
          budgetLineName: allocation.budgetLine.name,
          currentAllocation: allocation.allocatedAmount,
          newAllocation: allocation.allocatedAmount + deltaAllocation,
          deltaAllocation
        };
      });

      // Check funds availability
      const totalDelta = budgetImpact.reduce((sum, b) => sum + b.deltaAllocation, 0n);
      const fundsAvailable = contract.fundingBucket.availableCents >= totalDelta;

      // Determine approval requirements based on amount
      const approvalRequired: string[] = [];
      if (Math.abs(Number(changeOrder.deltaAmount)) > 1000000) { // > $10,000
        approvalRequired.push('PROJECT_MANAGER', 'FINANCE_REVIEWER');
      }
      if (Math.abs(Number(changeOrder.deltaAmount)) > 5000000) { // > $50,000
        approvalRequired.push('TREASURER');
      }
      if (Math.abs(Number(changeOrder.deltaAmount)) > 10000000) { // > $100,000
        approvalRequired.push('DAO_MULTISIG');
      }

      const impact: ChangeOrderImpact = {
        contractId: contract.id,
        currentAmount: contract.currentAmount,
        newAmount,
        deltaAmount: changeOrder.deltaAmount,
        currentEndDate: contract.endDate || undefined,
        newEndDate: changeOrder.newEndDate || undefined,
        deltaTimedays: changeOrder.deltaTimedays || undefined,
        budgetImpact,
        fundsAvailable,
        approvalRequired
      };

      logger.info(`Calculated impact for change order ${changeOrderId}`, { 
        changeOrderId,
        deltaAmount: changeOrder.deltaAmount.toString(),
        fundsAvailable,
        approvalRequired 
      });

      return impact;
    } catch (error) {
      logger.error(`Failed to calculate impact for change order ${changeOrderId}`, { error, changeOrderId });
      throw error;
    }
  }

  async approveChangeOrder(changeOrderId: number, approval: ApprovalData): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update change order
        const changeOrder = await tx.changeOrder.update({
          where: { id: changeOrderId },
          data: {
            status: ChangeOrderStatus.APPROVED,
            approvalStatus: ApprovalStatus.APPROVED,
            approvedBy: approval.approvedBy,
            approvedAt: new Date()
          }
        });

        // Update contract with new amount and dates
        await tx.financeContract.update({
          where: { id: changeOrder.contractId },
          data: {
            currentAmount: changeOrder.newContractTotal,
            endDate: changeOrder.newEndDate || undefined
          }
        });
      });

      logger.info(`Approved change order ${changeOrderId}`, { 
        changeOrderId,
        approvedBy: approval.approvedBy 
      });
    } catch (error) {
      logger.error(`Failed to approve change order ${changeOrderId}`, { error, changeOrderId, approval });
      throw error;
    }
  }

  async implementChangeOrder(changeOrderId: number): Promise<void> {
    try {
      await this.prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          status: ChangeOrderStatus.IMPLEMENTED,
          implementedAt: new Date(),
          implementedBy: 'system' // TODO: Get from context
        }
      });

      logger.info(`Implemented change order ${changeOrderId}`, { changeOrderId });
    } catch (error) {
      logger.error(`Failed to implement change order ${changeOrderId}`, { error, changeOrderId });
      throw error;
    }
  }

  // Budget management
  async validateBudgetAllocation(allocations: BudgetAllocation[]): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if budget lines exist and have available funds
      for (const allocation of allocations) {
        const budgetLine = await this.prisma.budgetLine.findUnique({
          where: { id: allocation.budgetLineId }
        });

        if (!budgetLine) {
          errors.push(`Budget line ${allocation.budgetLineId} not found`);
          continue;
        }

        const availableAmount = budgetLine.revisedBudget - budgetLine.committedAmount;
        if (allocation.allocatedAmount > availableAmount) {
          errors.push(`Allocation ${allocation.allocatedAmount} exceeds available budget ${availableAmount} for line ${budgetLine.name}`);
        }
      }

      // Check for duplicate budget line allocations
      const budgetLineIds = allocations.map(a => a.budgetLineId);
      const uniqueIds = new Set(budgetLineIds);
      if (budgetLineIds.length !== uniqueIds.size) {
        errors.push('Duplicate budget line allocations not allowed');
      }

      // Check that percentages add up to 100% if provided
      const percentages = allocations.filter(a => a.percentage).map(a => a.percentage!);
      if (percentages.length > 0 && percentages.length === allocations.length) {
        const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
        if (totalPercentage !== 100) {
          warnings.push(`Allocation percentages total ${totalPercentage}%, not 100%`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error(`Failed to validate budget allocation`, { error, allocations });
      return {
        valid: false,
        errors: ['Validation failed due to system error'],
        warnings: []
      };
    }
  }

  async updateContractAmount(contractId: number, newAmount: bigint): Promise<void> {
    try {
      await this.prisma.financeContract.update({
        where: { id: contractId },
        data: {
          currentAmount: newAmount,
          updatedAt: new Date()
        }
      });

      logger.info(`Updated contract amount for ${contractId}`, { 
        contractId, 
        newAmount: newAmount.toString() 
      });
    } catch (error) {
      logger.error(`Failed to update contract amount for ${contractId}`, { error, contractId, newAmount: newAmount.toString() });
      throw error;
    }
  }

  async calculateRetention(contractId: number): Promise<RetentionCalculation> {
    try {
      const contract = await this.prisma.financeContract.findUnique({
        where: { id: contractId },
        include: {
          invoices: {
            where: { status: { in: ['APPROVED', 'PAID'] } }
          }
        }
      });

      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      const retentionAmount = (contract.currentAmount * BigInt(contract.retentionPercent)) / 100n;
      
      // Calculate current retention held from paid invoices
      const currentRetentionHeld = contract.invoices.reduce((sum, invoice) => {
        return sum + invoice.retentionCents;
      }, 0n);

      // Calculate retention due (total retention - already held)
      const retentionDue = retentionAmount - currentRetentionHeld;

      const calculation: RetentionCalculation = {
        contractId,
        contractAmount: contract.currentAmount,
        retentionPercent: contract.retentionPercent,
        retentionAmount,
        currentRetentionHeld,
        retentionDue
      };

      logger.info(`Calculated retention for contract ${contractId}`, { 
        contractId,
        retentionAmount: retentionAmount.toString(),
        currentRetentionHeld: currentRetentionHeld.toString(),
        retentionDue: retentionDue.toString()
      });

      return calculation;
    } catch (error) {
      logger.error(`Failed to calculate retention for contract ${contractId}`, { error, contractId });
      throw error;
    }
  }
}