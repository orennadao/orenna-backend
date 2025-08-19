import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ContractStatus } from '@prisma/client';
import { ContractService } from '../../../src/lib/contract';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

describe('ContractService', () => {
  let contractService: ContractService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    contractService = new ContractService(prismaMock);
    mockReset(prismaMock);
  });

  describe('createContract', () => {
    it('should create contract with proper validations', async () => {
      const contractData = {
        projectId: 1,
        vendorId: 1,
        contractNumber: 'CNT-2024-001',
        title: 'Test Construction Contract',
        description: 'Test contract for construction services',
        amount: BigInt(1000000),
        currency: 'USD' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        retentionPercentage: 10,
        createdBy: 'admin@orenna.com',
      };

      // Mock project and vendor validation
      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
        status: 'ACTIVE',
      } as any);

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Vendor',
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
      } as any);

      const mockContract = {
        id: 1,
        ...contractData,
        status: ContractStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.financeContract.create.mockResolvedValue(mockContract as any);

      const result = await contractService.createContract(contractData);

      expect(result.id).toBe(1);
      expect(result.status).toBe(ContractStatus.DRAFT);
      expect(result.amount).toBe(BigInt(1000000));

      expect(prismaMock.financeContract.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 1,
          vendorId: 1,
          contractNumber: 'CNT-2024-001',
          status: ContractStatus.DRAFT,
        }),
      });
    });

    it('should throw error when project not found', async () => {
      const contractData = {
        projectId: 999,
        vendorId: 1,
        contractNumber: 'CNT-2024-001',
        title: 'Test Contract',
        amount: BigInt(1000000),
        currency: 'USD' as const,
        startDate: new Date(),
        endDate: new Date(),
        createdBy: 'admin@orenna.com',
      };

      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(contractService.createContract(contractData))
        .rejects.toThrow('Project 999 not found');
    });

    it('should throw error when vendor is not approved', async () => {
      const contractData = {
        projectId: 1,
        vendorId: 1,
        contractNumber: 'CNT-2024-001',
        title: 'Test Contract',
        amount: BigInt(1000000),
        currency: 'USD' as const,
        startDate: new Date(),
        endDate: new Date(),
        createdBy: 'admin@orenna.com',
      };

      prismaMock.project.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Project',
      } as any);

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Vendor',
        status: 'PENDING',
        kycStatus: 'PENDING',
      } as any);

      await expect(contractService.createContract(contractData))
        .rejects.toThrow('Vendor must be active and KYC approved');
    });
  });

  describe('allocateBudget', () => {
    it('should allocate budget to contract successfully', async () => {
      const contractId = 1;
      const allocations = [
        {
          fundingBucketId: 1,
          amount: BigInt(500000),
          wbsCode: '001.001',
          description: 'Foundation work',
        },
        {
          fundingBucketId: 2,
          amount: BigInt(300000),
          wbsCode: '001.002',
          description: 'Structural work',
        },
      ];

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        amount: BigInt(1000000),
        status: ContractStatus.DRAFT,
      } as any);

      // Mock funding bucket validation
      prismaMock.fundingBucket.findMany.mockResolvedValue([
        { id: 1, balance: BigInt(600000) },
        { id: 2, balance: BigInt(400000) },
      ] as any);

      prismaMock.budgetAllocation.createMany.mockResolvedValue({
        count: 2,
      });

      await contractService.allocateBudget(contractId, allocations);

      expect(prismaMock.budgetAllocation.createMany).toHaveBeenCalledWith({
        data: allocations.map(allocation => ({
          contractId,
          ...allocation,
        })),
      });
    });

    it('should throw error when total allocation exceeds contract amount', async () => {
      const contractId = 1;
      const allocations = [
        {
          fundingBucketId: 1,
          amount: BigInt(800000),
          wbsCode: '001.001',
          description: 'Foundation work',
        },
        {
          fundingBucketId: 2,
          amount: BigInt(500000),
          wbsCode: '001.002',
          description: 'Structural work',
        },
      ];

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        amount: BigInt(1000000),
        status: ContractStatus.DRAFT,
      } as any);

      await expect(contractService.allocateBudget(contractId, allocations))
        .rejects.toThrow('Total allocation (1300000) exceeds contract amount (1000000)');
    });
  });

  describe('approveContract', () => {
    it('should approve contract with proper authorization', async () => {
      const contractId = 1;
      const approverData = {
        approverId: 'manager@orenna.com',
        approverRole: 'PROJECT_MANAGER' as const,
        notes: 'Contract approved for execution',
      };

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        amount: BigInt(1000000),
        status: ContractStatus.PENDING_APPROVAL,
        title: 'Test Contract',
      } as any);

      // Mock approval matrix check
      prismaMock.approvalMatrix.findFirst.mockResolvedValue({
        id: 1,
        minAmount: BigInt(0),
        maxAmount: BigInt(5000000),
        requiredRole: 'PROJECT_MANAGER',
      } as any);

      prismaMock.financeContract.update.mockResolvedValue({
        id: contractId,
        status: ContractStatus.APPROVED,
      } as any);

      prismaMock.contractApproval.create.mockResolvedValue({
        id: 1,
        contractId,
        approverId: approverData.approverId,
      } as any);

      await contractService.approveContract(contractId, approverData);

      expect(prismaMock.financeContract.update).toHaveBeenCalledWith({
        where: { id: contractId },
        data: {
          status: ContractStatus.APPROVED,
          approvedAt: expect.any(Date),
          approvedBy: approverData.approverId,
        },
      });
    });

    it('should throw error when approver lacks authorization', async () => {
      const contractId = 1;
      const approverData = {
        approverId: 'user@orenna.com',
        approverRole: 'USER' as const,
        notes: 'Attempting to approve',
      };

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        amount: BigInt(1000000),
        status: ContractStatus.PENDING_APPROVAL,
      } as any);

      // Mock approval matrix - no matching rule for USER role
      prismaMock.approvalMatrix.findFirst.mockResolvedValue(null);

      await expect(contractService.approveContract(contractId, approverData))
        .rejects.toThrow('Approver lacks authorization for this contract amount');
    });
  });

  describe('createChangeOrder', () => {
    it('should create change order with impact analysis', async () => {
      const contractId = 1;
      const changeData = {
        title: 'Additional Foundation Work',
        description: 'Extra excavation required due to soil conditions',
        amountChange: BigInt(150000),
        timeChange: 14, // days
        justification: 'Unforeseen soil conditions require additional work',
        requestedBy: 'field@contractor.com',
      };

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        amount: BigInt(1000000),
        status: ContractStatus.ACTIVE,
        title: 'Original Contract',
      } as any);

      const mockChangeOrder = {
        id: 1,
        contractId,
        ...changeData,
        status: 'PENDING',
        createdAt: new Date(),
      };

      prismaMock.changeOrder.create.mockResolvedValue(mockChangeOrder as any);

      const result = await contractService.createChangeOrder(contractId, changeData);

      expect(result.id).toBe(1);
      expect(result.amountChange).toBe(BigInt(150000));
      expect(result.status).toBe('PENDING');

      expect(prismaMock.changeOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractId,
          title: changeData.title,
          amountChange: changeData.amountChange,
          status: 'PENDING',
        }),
      });
    });
  });

  describe('calculateImpact', () => {
    it('should calculate change order impact on contract', async () => {
      const changeOrderId = 1;

      prismaMock.changeOrder.findUnique.mockResolvedValue({
        id: changeOrderId,
        contractId: 1,
        amountChange: BigInt(150000),
        timeChange: 14,
        contract: {
          id: 1,
          amount: BigInt(1000000),
          endDate: new Date('2024-12-31'),
        },
      } as any);

      // Mock existing approved change orders
      prismaMock.changeOrder.findMany.mockResolvedValue([
        { amountChange: BigInt(50000), timeChange: 7 },
        { amountChange: BigInt(-25000), timeChange: 0 },
      ] as any);

      const result = await contractService.calculateImpact(changeOrderId);

      expect(result.newContractAmount).toBe(BigInt(1175000)); // 1000000 + 150000 + 50000 - 25000
      expect(result.totalAmountChange).toBe(BigInt(175000)); // 150000 + 50000 - 25000
      expect(result.totalTimeChange).toBe(21); // 14 + 7 + 0
      expect(result.percentageIncrease).toBe(17.5); // (175000 / 1000000) * 100
    });
  });
});