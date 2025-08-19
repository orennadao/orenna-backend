import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { InvoiceService } from '../../../src/lib/invoice';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    invoiceService = new InvoiceService(prismaMock);
    mockReset(prismaMock);
  });

  describe('createInvoice', () => {
    it('should create invoice with proper validation', async () => {
      const invoiceData = {
        contractId: 1,
        invoiceNumber: 'INV-2024-001',
        amount: BigInt(250000),
        currency: 'USD' as const,
        description: 'Monthly progress billing',
        workPeriodStart: new Date('2024-01-01'),
        workPeriodEnd: new Date('2024-01-31'),
        dueDate: new Date('2024-02-28'),
        retentionAmount: BigInt(25000),
        submittedBy: 'vendor@contractor.com',
        lineItems: [
          {
            description: 'Foundation work completed',
            quantity: 1,
            unitPrice: BigInt(200000),
            amount: BigInt(200000),
            wbsCode: '001.001',
          },
          {
            description: 'Materials delivered',
            quantity: 1,
            unitPrice: BigInt(50000),
            amount: BigInt(50000),
            wbsCode: '001.002',
          },
        ],
      };

      // Mock contract validation
      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: 1,
        amount: BigInt(1000000),
        status: 'ACTIVE',
        vendorId: 1,
        vendor: { name: 'Test Contractor' },
      } as any);

      const mockInvoice = {
        id: 1,
        ...invoiceData,
        status: InvoiceStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.invoice.create.mockResolvedValue(mockInvoice as any);

      const result = await invoiceService.createInvoice(invoiceData);

      expect(result.id).toBe(1);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.amount).toBe(BigInt(250000));
      expect(result.retentionAmount).toBe(BigInt(25000));

      expect(prismaMock.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractId: 1,
          invoiceNumber: 'INV-2024-001',
          status: InvoiceStatus.DRAFT,
          amount: BigInt(250000),
        }),
      });
    });

    it('should throw error when contract not found', async () => {
      const invoiceData = {
        contractId: 999,
        invoiceNumber: 'INV-2024-001',
        amount: BigInt(250000),
        currency: 'USD' as const,
        description: 'Test invoice',
        dueDate: new Date(),
        submittedBy: 'vendor@contractor.com',
      };

      prismaMock.financeContract.findUnique.mockResolvedValue(null);

      await expect(invoiceService.createInvoice(invoiceData))
        .rejects.toThrow('Contract 999 not found');
    });

    it('should throw error when line items do not sum to total', async () => {
      const invoiceData = {
        contractId: 1,
        invoiceNumber: 'INV-2024-001',
        amount: BigInt(300000), // Wrong total
        currency: 'USD' as const,
        description: 'Test invoice',
        dueDate: new Date(),
        submittedBy: 'vendor@contractor.com',
        lineItems: [
          {
            description: 'Work completed',
            quantity: 1,
            unitPrice: BigInt(200000),
            amount: BigInt(200000),
          },
        ],
      };

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: 1,
        status: 'ACTIVE',
      } as any);

      await expect(invoiceService.createInvoice(invoiceData))
        .rejects.toThrow('Line items total (200000) does not match invoice amount (300000)');
    });
  });

  describe('validateInvoice', () => {
    it('should validate invoice against contract terms', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        contractId: 1,
        amount: BigInt(250000),
        retentionAmount: BigInt(25000),
        workPeriodStart: new Date('2024-01-01'),
        workPeriodEnd: new Date('2024-01-31'),
        contract: {
          id: 1,
          amount: BigInt(1000000),
          retentionPercentage: 10,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      } as any);

      // Mock previous invoices to check cumulative billing
      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(500000) }
      } as any);

      const result = await invoiceService.validateInvoice(invoiceId);

      expect(result.isValid).toBe(true);
      expect(result.validations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ check: 'retention_calculation', passed: true }),
          expect.objectContaining({ check: 'work_period_valid', passed: true }),
          expect.objectContaining({ check: 'cumulative_billing_check', passed: true }),
        ])
      );
    });

    it('should fail validation when retention calculation is incorrect', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        amount: BigInt(250000),
        retentionAmount: BigInt(10000), // Should be 25000 (10%)
        contract: {
          retentionPercentage: 10,
          amount: BigInt(1000000),
        },
      } as any);

      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(0) }
      } as any);

      const result = await invoiceService.validateInvoice(invoiceId);

      expect(result.isValid).toBe(false);
      expect(result.validations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            check: 'retention_calculation',
            passed: false,
            message: expect.stringContaining('Retention amount should be 25000'),
          }),
        ])
      );
    });
  });

  describe('routeForApproval', () => {
    it('should route invoice to appropriate approver based on amount', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        amount: BigInt(250000),
        contractId: 1,
        status: InvoiceStatus.SUBMITTED,
      } as any);

      // Mock approval matrix lookup
      prismaMock.approvalMatrix.findFirst.mockResolvedValue({
        id: 1,
        minAmount: BigInt(100000),
        maxAmount: BigInt(500000),
        requiredRole: 'PROJECT_MANAGER',
        autoApprovalEnabled: false,
      } as any);

      // Mock finding eligible approvers
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'pm1@orenna.com',
          name: 'Project Manager 1',
          roles: [{ name: 'PROJECT_MANAGER' }],
        },
        {
          id: 'pm2@orenna.com',
          name: 'Project Manager 2',
          roles: [{ name: 'PROJECT_MANAGER' }],
        },
      ] as any);

      prismaMock.invoiceApproval.create.mockResolvedValue({
        id: 1,
        invoiceId,
        approverId: 'pm1@orenna.com',
        status: 'PENDING',
      } as any);

      const result = await invoiceService.routeForApproval(invoiceId);

      expect(result.assignedApproverId).toBe('pm1@orenna.com');
      expect(result.requiredRole).toBe('PROJECT_MANAGER');
      expect(result.autoApproval).toBe(false);

      expect(prismaMock.invoiceApproval.create).toHaveBeenCalledWith({
        data: {
          invoiceId,
          approverId: 'pm1@orenna.com',
          status: 'PENDING',
          assignedAt: expect.any(Date),
        },
      });
    });

    it('should auto-approve small invoices when enabled', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        amount: BigInt(5000),
        status: InvoiceStatus.SUBMITTED,
      } as any);

      prismaMock.approvalMatrix.findFirst.mockResolvedValue({
        id: 1,
        minAmount: BigInt(0),
        maxAmount: BigInt(10000),
        requiredRole: 'SYSTEM',
        autoApprovalEnabled: true,
      } as any);

      prismaMock.invoice.update.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.APPROVED,
      } as any);

      const result = await invoiceService.routeForApproval(invoiceId);

      expect(result.autoApproval).toBe(true);
      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.APPROVED,
          approvedAt: expect.any(Date),
          approvedBy: 'SYSTEM_AUTO_APPROVAL',
        },
      });
    });
  });

  describe('checkFundsAvailability', () => {
    it('should check funds availability across relevant buckets', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        amount: BigInt(250000),
        contractId: 1,
        lineItems: [
          { amount: BigInt(200000), wbsCode: '001.001' },
          { amount: BigInt(50000), wbsCode: '001.002' },
        ],
        contract: {
          budgetAllocations: [
            { fundingBucketId: 1, amount: BigInt(300000), wbsCode: '001.001' },
            { fundingBucketId: 2, amount: BigInt(100000), wbsCode: '001.002' },
          ],
        },
      } as any);

      // Mock funding bucket balances
      prismaMock.fundingBucket.findMany.mockResolvedValue([
        { id: 1, balance: BigInt(800000) },
        { id: 2, balance: BigInt(150000) },
      ] as any);

      // Mock committed amounts calculation
      prismaMock.ledgerEntry.groupBy.mockResolvedValue([
        { fundingBucketId: 1, _sum: { amount: BigInt(400000) } },
        { fundingBucketId: 2, _sum: { amount: BigInt(80000) } },
      ] as any);

      const result = await invoiceService.checkFundsAvailability(invoiceId);

      expect(result.available).toBe(true);
      expect(result.bucketChecks).toHaveLength(2);
      expect(result.bucketChecks[0].available).toBe(true); // 800000 - 400000 >= 200000
      expect(result.bucketChecks[1].available).toBe(true); // 150000 - 80000 >= 50000
    });

    it('should detect insufficient funds', async () => {
      const invoiceId = 1;

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        amount: BigInt(250000),
        lineItems: [
          { amount: BigInt(200000), wbsCode: '001.001' },
        ],
        contract: {
          budgetAllocations: [
            { fundingBucketId: 1, amount: BigInt(300000), wbsCode: '001.001' },
          ],
        },
      } as any);

      prismaMock.fundingBucket.findMany.mockResolvedValue([
        { id: 1, balance: BigInt(100000) }, // Insufficient
      ] as any);

      prismaMock.ledgerEntry.groupBy.mockResolvedValue([
        { fundingBucketId: 1, _sum: { amount: BigInt(50000) } },
      ] as any);

      const result = await invoiceService.checkFundsAvailability(invoiceId);

      expect(result.available).toBe(false);
      expect(result.bucketChecks[0].available).toBe(false);
      expect(result.bucketChecks[0].shortfall).toBe(BigInt(150000)); // 200000 - (100000 - 50000)
    });
  });

  describe('scheduleForPayment', () => {
    it('should schedule approved invoice for payment', async () => {
      const invoiceId = 1;
      const paymentDate = new Date('2024-02-15');

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.APPROVED,
        amount: BigInt(250000),
        contractId: 1,
      } as any);

      prismaMock.invoice.update.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.SCHEDULED,
        scheduledPaymentDate: paymentDate,
      } as any);

      await invoiceService.scheduleForPayment(invoiceId, paymentDate);

      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.SCHEDULED,
          scheduledPaymentDate: paymentDate,
          scheduledAt: expect.any(Date),
        },
      });
    });

    it('should throw error when invoice not approved', async () => {
      const invoiceId = 1;
      const paymentDate = new Date('2024-02-15');

      prismaMock.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING_APPROVAL,
      } as any);

      await expect(invoiceService.scheduleForPayment(invoiceId, paymentDate))
        .rejects.toThrow('Invoice must be approved before scheduling payment');
    });
  });
});