import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { LedgerService } from '../../../src/lib/ledger';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

describe('LedgerService', () => {
  let ledgerService: LedgerService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    ledgerService = new LedgerService(prismaMock);
    mockReset(prismaMock);
  });

  describe('commitFunds', () => {
    it('should commit funds to a contract successfully', async () => {
      const contractId = 1;
      const amount = BigInt(100000);

      // Mock contract with funding bucket
      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        fundingBucket: {
          id: 1,
          name: 'Test Bucket',
          balance: BigInt(500000),
        },
      } as any);

      // Mock ledger entry creation
      prismaMock.ledgerEntry.create.mockResolvedValue({
        id: 1,
        entryNumber: 'LE-2024-001',
        amount,
        type: 'COMMIT',
        description: 'Fund commitment for contract',
        createdAt: new Date(),
      } as any);

      // Mock balance calculation
      prismaMock.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(400000) }
      } as any);

      const result = await ledgerService.commitFunds(contractId, amount);

      expect(result.success).toBe(true);
      expect(result.entryNumber).toBe('LE-2024-001');
      expect(result.balanceAfter).toBe(BigInt(400000));
      expect(prismaMock.financeContract.findUnique).toHaveBeenCalledWith({
        where: { id: contractId },
        include: { fundingBucket: true }
      });
    });

    it('should throw error when contract not found', async () => {
      const contractId = 999;
      const amount = BigInt(100000);

      prismaMock.financeContract.findUnique.mockResolvedValue(null);

      await expect(ledgerService.commitFunds(contractId, amount))
        .rejects.toThrow('Contract 999 not found');
    });

    it('should throw error when insufficient funds', async () => {
      const contractId = 1;
      const amount = BigInt(600000); // More than available

      prismaMock.financeContract.findUnique.mockResolvedValue({
        id: contractId,
        fundingBucket: {
          id: 1,
          name: 'Test Bucket',
          balance: BigInt(500000),
        },
      } as any);

      // Mock current balance check
      prismaMock.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(500000) }
      } as any);

      await expect(ledgerService.commitFunds(contractId, amount))
        .rejects.toThrow('Insufficient funds');
    });
  });

  describe('validateFundsAvailability', () => {
    it('should return true when funds are available', async () => {
      const bucketId = 1;
      const amount = BigInt(100000);

      // Mock bucket with sufficient balance
      prismaMock.fundingBucket.findUnique.mockResolvedValue({
        id: bucketId,
        balance: BigInt(500000),
      } as any);

      // Mock current usage calculation
      prismaMock.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(200000) }
      } as any);

      const result = await ledgerService.validateFundsAvailability(bucketId, amount);

      expect(result).toBe(true);
    });

    it('should return false when funds are insufficient', async () => {
      const bucketId = 1;
      const amount = BigInt(400000);

      prismaMock.fundingBucket.findUnique.mockResolvedValue({
        id: bucketId,
        balance: BigInt(500000),
      } as any);

      // Mock high current usage
      prismaMock.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(450000) }
      } as any);

      const result = await ledgerService.validateFundsAvailability(bucketId, amount);

      expect(result).toBe(false);
    });
  });

  describe('reconcileBucket', () => {
    it('should reconcile bucket successfully when balanced', async () => {
      const bucketId = 1;

      prismaMock.fundingBucket.findUnique.mockResolvedValue({
        id: bucketId,
        name: 'Test Bucket',
        balance: BigInt(500000),
      } as any);

      prismaMock.ledgerEntry.findMany.mockResolvedValue([
        { amount: BigInt(100000), type: 'COMMIT' },
        { amount: BigInt(50000), type: 'ENCUMBER' },
      ] as any);

      prismaMock.ledgerEntry.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(150000) }
      } as any);

      const result = await ledgerService.reconcileBucket(bucketId);

      expect(result.reconciled).toBe(true);
      expect(result.discrepancy).toBe(BigInt(0));
      expect(result.expectedBalance).toBe(BigInt(350000)); // 500000 - 150000
    });
  });

  describe('generateLedgerReport', () => {
    it('should generate comprehensive ledger report', async () => {
      const bucketId = 1;
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const mockEntries = [
        {
          id: 1,
          amount: BigInt(100000),
          type: 'COMMIT',
          createdAt: new Date('2024-06-01'),
        },
        {
          id: 2,
          amount: BigInt(-50000),
          type: 'DISBURSE',
          createdAt: new Date('2024-06-15'),
        },
      ];

      prismaMock.ledgerEntry.findMany.mockResolvedValue(mockEntries as any);

      // Mock opening balance calculation
      prismaMock.ledgerEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: BigInt(200000) } }) // Opening balance
        .mockResolvedValueOnce({ _sum: { amount: BigInt(100000) } }) // Total debits
        .mockResolvedValueOnce({ _sum: { amount: BigInt(50000) } }); // Total credits

      const result = await ledgerService.generateLedgerReport(bucketId, dateRange);

      expect(result.bucketId).toBe(bucketId);
      expect(result.openingBalance).toBe(BigInt(200000));
      expect(result.totalDebits).toBe(BigInt(100000));
      expect(result.totalCredits).toBe(BigInt(50000));
      expect(result.closingBalance).toBe(BigInt(250000)); // 200000 + 100000 - 50000
      expect(result.entries).toHaveLength(2);
    });
  });
});