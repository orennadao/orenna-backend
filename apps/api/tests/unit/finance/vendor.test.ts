import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, VendorStatus, KycStatus } from '@prisma/client';
import { VendorService } from '../../../src/lib/vendor';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

describe('VendorService', () => {
  let vendorService: VendorService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    vendorService = new VendorService(prismaMock);
    mockReset(prismaMock);
  });

  describe('createVendor', () => {
    it('should create vendor successfully', async () => {
      const vendorData = {
        name: 'Test Vendor LLC',
        legalName: 'Test Vendor Legal Name LLC',
        email: 'contact@testvendor.com',
        phone: '+1-555-0123',
        website: 'https://testvendor.com',
        address: {
          street: '123 Business St',
          city: 'Tech City',
          state: 'CA',
          zip: '90210',
          country: 'US',
        },
        taxId: '12-3456789',
        createdBy: 'admin@orenna.com',
      };

      const mockVendor = {
        id: 1,
        name: vendorData.name,
        legalName: vendorData.legalName,
        email: vendorData.email,
        status: VendorStatus.PENDING,
        kycStatus: KycStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.vendor.create.mockResolvedValue(mockVendor as any);

      const result = await vendorService.createVendor(vendorData);

      expect(result.id).toBe(1);
      expect(result.name).toBe(vendorData.name);
      expect(result.status).toBe(VendorStatus.PENDING);
      expect(result.kycStatus).toBe(KycStatus.PENDING);

      expect(prismaMock.vendor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: vendorData.name,
          legalName: vendorData.legalName,
          email: vendorData.email,
          status: VendorStatus.PENDING,
          kycStatus: KycStatus.PENDING,
        }),
      });
    });

    it('should throw error when vendor with same name exists', async () => {
      const vendorData = {
        name: 'Existing Vendor',
        createdBy: 'admin@orenna.com',
      };

      prismaMock.vendor.findFirst.mockResolvedValue({
        id: 1,
        name: 'Existing Vendor',
      } as any);

      await expect(vendorService.createVendor(vendorData))
        .rejects.toThrow('Vendor with name "Existing Vendor" already exists');
    });
  });

  describe('submitKYCDocuments', () => {
    it('should upload KYC documents and update status', async () => {
      const vendorId = 1;
      const documents = [
        {
          fileName: 'business-license.pdf',
          originalFileName: 'Business License.pdf',
          fileHash: 'hash123',
          fileSize: BigInt(1024000),
          mimeType: 'application/pdf',
          documentType: 'BUSINESS_LICENSE' as const,
          issueDate: new Date('2024-01-01'),
          expiryDate: new Date('2025-01-01'),
        },
      ];

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: vendorId,
        name: 'Test Vendor',
        kycStatus: KycStatus.PENDING,
      } as any);

      prismaMock.vendorDocument.create.mockResolvedValue({
        id: 1,
        vendorId,
        fileName: documents[0].fileName,
        documentType: documents[0].documentType,
        createdAt: new Date(),
      } as any);

      prismaMock.vendor.update.mockResolvedValue({
        id: vendorId,
        kycStatus: KycStatus.UNDER_REVIEW,
      } as any);

      await vendorService.submitKYCDocuments(vendorId, documents);

      expect(prismaMock.vendorDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId,
          fileName: documents[0].fileName,
          documentType: documents[0].documentType,
        }),
      });

      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: { kycStatus: KycStatus.UNDER_REVIEW },
      });
    });

    it('should throw error when vendor not found', async () => {
      const vendorId = 999;
      const documents = [];

      prismaMock.vendor.findUnique.mockResolvedValue(null);

      await expect(vendorService.submitKYCDocuments(vendorId, documents))
        .rejects.toThrow('Vendor 999 not found');
    });
  });

  describe('reviewKYCStatus', () => {
    it('should approve KYC and update vendor status', async () => {
      const vendorId = 1;
      const decision = {
        approved: true,
        notes: 'All documents verified',
        reviewedBy: 'compliance@orenna.com',
      };

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: vendorId,
        name: 'Test Vendor',
        kycStatus: KycStatus.UNDER_REVIEW,
      } as any);

      prismaMock.vendor.update.mockResolvedValue({
        id: vendorId,
        kycStatus: KycStatus.APPROVED,
        status: VendorStatus.ACTIVE,
      } as any);

      await vendorService.reviewKYCStatus(vendorId, decision);

      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: {
          kycStatus: KycStatus.APPROVED,
          status: VendorStatus.ACTIVE,
          kycApprovedAt: expect.any(Date),
          kycApprovedBy: decision.reviewedBy,
        },
      });
    });

    it('should reject KYC with proper status update', async () => {
      const vendorId = 1;
      const decision = {
        approved: false,
        notes: 'Incomplete documentation',
        reviewedBy: 'compliance@orenna.com',
      };

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: vendorId,
        name: 'Test Vendor',
        kycStatus: KycStatus.UNDER_REVIEW,
      } as any);

      prismaMock.vendor.update.mockResolvedValue({
        id: vendorId,
        kycStatus: KycStatus.REJECTED,
        status: VendorStatus.PENDING,
      } as any);

      await vendorService.reviewKYCStatus(vendorId, decision);

      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: {
          kycStatus: KycStatus.REJECTED,
          status: VendorStatus.PENDING,
          kycRejectedAt: expect.any(Date),
          kycRejectedBy: decision.reviewedBy,
        },
      });
    });
  });

  describe('runSanctionsCheck', () => {
    it('should perform sanctions check and update compliance status', async () => {
      const vendorId = 1;

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: vendorId,
        name: 'Test Vendor',
        legalName: 'Test Vendor LLC',
      } as any);

      // Mock external sanctions API response
      const mockSanctionsResult = {
        vendorId,
        sanctionsStatus: 'CLEAR' as const,
        checkedAt: new Date(),
        results: { ofacMatches: 0, euMatches: 0, unMatches: 0 },
      };

      prismaMock.vendor.update.mockResolvedValue({
        id: vendorId,
        sanctionsStatus: 'CLEAR',
      } as any);

      const result = await vendorService.runSanctionsCheck(vendorId);

      expect(result.sanctionsStatus).toBe('CLEAR');
      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: {
          sanctionsStatus: 'CLEAR',
          sanctionsCheckedAt: expect.any(Date),
        },
      });
    });

    it('should flag vendor when sanctions match found', async () => {
      const vendorId = 1;

      prismaMock.vendor.findUnique.mockResolvedValue({
        id: vendorId,
        name: 'Flagged Vendor',
        legalName: 'Flagged Vendor LLC',
      } as any);

      // Mock sanctions API with matches
      vi.spyOn(vendorService as any, 'checkSanctionsLists').mockResolvedValue({
        ofacMatches: 1,
        euMatches: 0,
        unMatches: 0,
        details: ['OFAC SDN List match found'],
      });

      prismaMock.vendor.update.mockResolvedValue({
        id: vendorId,
        sanctionsStatus: 'FLAGGED',
      } as any);

      const result = await vendorService.runSanctionsCheck(vendorId);

      expect(result.sanctionsStatus).toBe('FLAGGED');
      expect(prismaMock.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: {
          sanctionsStatus: 'FLAGGED',
          sanctionsCheckedAt: expect.any(Date),
        },
      });
    });
  });

  describe('checkDocumentExpiry', () => {
    it('should identify documents expiring within warning period', async () => {
      const mockExpiringDocs = [
        {
          id: 1,
          vendorId: 1,
          documentType: 'BUSINESS_LICENSE',
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          vendor: { name: 'Test Vendor', email: 'test@vendor.com' },
        },
        {
          id: 2,
          vendorId: 2,
          documentType: 'INSURANCE_COI',
          expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          vendor: { name: 'Another Vendor', email: 'another@vendor.com' },
        },
      ];

      prismaMock.vendorDocument.findMany.mockResolvedValue(mockExpiringDocs as any);

      const notifications = await vendorService.checkDocumentExpiry();

      expect(notifications).toHaveLength(2);
      expect(notifications[0].urgency).toBe('MEDIUM'); // 15 days
      expect(notifications[1].urgency).toBe('HIGH'); // 5 days
      expect(notifications[0].vendorName).toBe('Test Vendor');
      expect(notifications[1].vendorName).toBe('Another Vendor');
    });

    it('should return empty array when no documents are expiring', async () => {
      prismaMock.vendorDocument.findMany.mockResolvedValue([]);

      const notifications = await vendorService.checkDocumentExpiry();

      expect(notifications).toHaveLength(0);
    });
  });
});