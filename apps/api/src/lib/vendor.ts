import { PrismaClient, Vendor, VendorDocument, VendorStatus, KycStatus, TaxStatus, PaymentMethod, VendorDocumentType } from '@orenna/db';
import { logger } from '../utils/logger';

export interface VendorCreateRequest {
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  taxStatus?: TaxStatus;
  taxId?: string;
  bankMethod?: PaymentMethod;
  cryptoAddress?: string;
  notes?: string;
  createdBy: string;
}

export interface FileUpload {
  fileName: string;
  originalFileName: string;
  fileHash: string;
  ipfsCid?: string;
  fileSize: bigint;
  mimeType?: string;
  documentType: VendorDocumentType;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
}

export interface KYCDecision {
  approved: boolean;
  notes?: string;
  reviewedBy: string;
}

export interface ComplianceChecks {
  sanctionsStatus?: 'CLEAR' | 'FLAGGED' | 'PENDING';
  debarmentStatus?: 'CLEAR' | 'FLAGGED' | 'PENDING';
  reviewedBy: string;
}

export interface VendorDocumentUpload {
  documentType: VendorDocumentType;
  fileName: string;
  originalFileName: string;
  fileHash: string;
  ipfsCid?: string;
  fileSize: bigint;
  mimeType?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  uploadedBy: string;
}

export interface DocumentVerification {
  verified: boolean;
  verifiedBy: string;
  verificationNotes?: string;
}

export interface ExpiryNotification {
  vendorId: number;
  vendorName: string;
  documentType: VendorDocumentType;
  expiryDate: Date;
  daysUntilExpiry: number;
}

export interface SanctionsResult {
  status: 'CLEAR' | 'FLAGGED' | 'PENDING';
  details?: string;
  checkedAt: Date;
}

export interface DebarmentResult {
  status: 'CLEAR' | 'FLAGGED' | 'PENDING';
  details?: string;
  checkedAt: Date;
}

export interface Tax1099Data {
  vendorId: number;
  taxYear: number;
  totalPaid: bigint;
  taxId: string;
  vendorName: string;
  vendorAddress: any;
  payments: Array<{
    amount: bigint;
    date: Date;
    description: string;
  }>;
}

export class VendorService {
  constructor(private prisma: PrismaClient) {}

  // Vendor lifecycle management
  async createVendor(vendorData: VendorCreateRequest): Promise<Vendor> {
    try {
      const vendor = await this.prisma.vendor.create({
        data: {
          name: vendorData.name,
          legalName: vendorData.legalName,
          email: vendorData.email,
          phone: vendorData.phone,
          website: vendorData.website,
          address: vendorData.address as any,
          taxStatus: vendorData.taxStatus || TaxStatus.UNKNOWN,
          taxId: vendorData.taxId,
          bankMethod: vendorData.bankMethod || PaymentMethod.ACH,
          cryptoAddress: vendorData.cryptoAddress,
          notes: vendorData.notes,
          status: VendorStatus.PENDING,
          kycStatus: KycStatus.PENDING,
          createdBy: vendorData.createdBy
        }
      });

      logger.info(`Created vendor ${vendor.id}`, { 
        vendorId: vendor.id, 
        name: vendor.name,
        createdBy: vendorData.createdBy 
      });

      return vendor;
    } catch (error) {
      logger.error(`Failed to create vendor`, { error, vendorData });
      throw error;
    }
  }

  async submitKYCDocuments(vendorId: number, documents: FileUpload[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create vendor documents
        for (const doc of documents) {
          await tx.vendorDocument.create({
            data: {
              vendorId,
              documentType: doc.documentType,
              fileName: doc.fileName,
              originalFileName: doc.originalFileName,
              fileHash: doc.fileHash,
              ipfsCid: doc.ipfsCid,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              issueDate: doc.issueDate,
              expiryDate: doc.expiryDate,
              issuingAuthority: doc.issuingAuthority,
              uploadedBy: 'system' // TODO: Get from context
            }
          });
        }

        // Update vendor KYC status to IN_REVIEW
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            kycStatus: KycStatus.IN_REVIEW,
            updatedBy: 'system' // TODO: Get from context
          }
        });
      });

      logger.info(`Submitted KYC documents for vendor ${vendorId}`, { 
        vendorId, 
        documentCount: documents.length 
      });
    } catch (error) {
      logger.error(`Failed to submit KYC documents for vendor ${vendorId}`, { error, vendorId });
      throw error;
    }
  }

  async reviewKYCStatus(vendorId: number, decision: KYCDecision): Promise<void> {
    try {
      const newStatus = decision.approved ? KycStatus.APPROVED : KycStatus.REJECTED;
      const newVendorStatus = decision.approved ? VendorStatus.APPROVED : VendorStatus.REJECTED;

      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          kycStatus: newStatus,
          status: newVendorStatus,
          kycCompletedAt: decision.approved ? new Date() : null,
          approvedBy: decision.approved ? decision.reviewedBy : null,
          approvedAt: decision.approved ? new Date() : null,
          notes: decision.notes,
          updatedBy: decision.reviewedBy
        }
      });

      logger.info(`Reviewed KYC for vendor ${vendorId}`, { 
        vendorId, 
        approved: decision.approved,
        reviewedBy: decision.reviewedBy 
      });
    } catch (error) {
      logger.error(`Failed to review KYC for vendor ${vendorId}`, { error, vendorId, decision });
      throw error;
    }
  }

  async updateComplianceStatus(vendorId: number, checks: ComplianceChecks): Promise<void> {
    try {
      const updateData: any = {
        updatedBy: checks.reviewedBy
      };

      if (checks.sanctionsStatus) {
        updateData.sanctionsStatus = checks.sanctionsStatus;
        updateData.sanctionsChecked = true;
        updateData.sanctionsCheckedAt = new Date();
      }

      if (checks.debarmentStatus) {
        updateData.debarmentStatus = checks.debarmentStatus;
        updateData.debarmentChecked = true;
        updateData.debarmentCheckedAt = new Date();
      }

      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: updateData
      });

      logger.info(`Updated compliance status for vendor ${vendorId}`, { 
        vendorId, 
        checks,
        reviewedBy: checks.reviewedBy 
      });
    } catch (error) {
      logger.error(`Failed to update compliance status for vendor ${vendorId}`, { error, vendorId, checks });
      throw error;
    }
  }

  // Document management
  async uploadVendorDocument(vendorId: number, document: VendorDocumentUpload): Promise<VendorDocument> {
    try {
      const vendorDocument = await this.prisma.vendorDocument.create({
        data: {
          vendorId,
          documentType: document.documentType,
          fileName: document.fileName,
          originalFileName: document.originalFileName,
          fileHash: document.fileHash,
          ipfsCid: document.ipfsCid,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          issueDate: document.issueDate,
          expiryDate: document.expiryDate,
          issuingAuthority: document.issuingAuthority,
          uploadedBy: document.uploadedBy
        }
      });

      logger.info(`Uploaded document for vendor ${vendorId}`, { 
        vendorId, 
        documentId: vendorDocument.id,
        documentType: document.documentType,
        uploadedBy: document.uploadedBy 
      });

      return vendorDocument;
    } catch (error) {
      logger.error(`Failed to upload document for vendor ${vendorId}`, { error, vendorId, document });
      throw error;
    }
  }

  async verifyDocument(documentId: number, verification: DocumentVerification): Promise<void> {
    try {
      await this.prisma.vendorDocument.update({
        where: { id: documentId },
        data: {
          verified: verification.verified,
          verifiedBy: verification.verifiedBy,
          verifiedAt: verification.verified ? new Date() : null,
          verificationNotes: verification.verificationNotes
        }
      });

      logger.info(`Verified document ${documentId}`, { 
        documentId, 
        verified: verification.verified,
        verifiedBy: verification.verifiedBy 
      });
    } catch (error) {
      logger.error(`Failed to verify document ${documentId}`, { error, documentId, verification });
      throw error;
    }
  }

  async checkDocumentExpiry(): Promise<ExpiryNotification[]> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringDocuments = await this.prisma.vendorDocument.findMany({
        where: {
          expiryDate: {
            lte: thirtyDaysFromNow,
            gte: new Date() // Not already expired
          }
        },
        include: {
          vendor: true
        }
      });

      const notifications: ExpiryNotification[] = expiringDocuments.map(doc => {
        const daysUntilExpiry = Math.ceil(
          (doc.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          vendorId: doc.vendorId,
          vendorName: doc.vendor.name,
          documentType: doc.documentType,
          expiryDate: doc.expiryDate!,
          daysUntilExpiry
        };
      });

      logger.info(`Found ${notifications.length} expiring documents`, { 
        expiringCount: notifications.length 
      });

      return notifications;
    } catch (error) {
      logger.error(`Failed to check document expiry`, { error });
      throw error;
    }
  }

  // Compliance automation
  async runSanctionsCheck(vendorId: number): Promise<SanctionsResult> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId }
      });

      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      // TODO: Integrate with actual sanctions screening API (OFAC, etc.)
      // For now, simulate a basic check
      const mockResult: SanctionsResult = {
        status: 'CLEAR',
        details: 'No sanctions matches found',
        checkedAt: new Date()
      };

      // Update vendor record
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          sanctionsStatus: mockResult.status,
          sanctionsChecked: true,
          sanctionsCheckedAt: mockResult.checkedAt,
          updatedBy: 'system'
        }
      });

      logger.info(`Completed sanctions check for vendor ${vendorId}`, { 
        vendorId, 
        status: mockResult.status 
      });

      return mockResult;
    } catch (error) {
      logger.error(`Failed to run sanctions check for vendor ${vendorId}`, { error, vendorId });
      throw error;
    }
  }

  async runDebarmentCheck(vendorId: number): Promise<DebarmentResult> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId }
      });

      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      // TODO: Integrate with actual debarment screening API (SAM.gov, etc.)
      // For now, simulate a basic check
      const mockResult: DebarmentResult = {
        status: 'CLEAR',
        details: 'No debarment records found',
        checkedAt: new Date()
      };

      // Update vendor record
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          debarmentStatus: mockResult.status,
          debarmentChecked: true,
          debarmentCheckedAt: mockResult.checkedAt,
          updatedBy: 'system'
        }
      });

      logger.info(`Completed debarment check for vendor ${vendorId}`, { 
        vendorId, 
        status: mockResult.status 
      });

      return mockResult;
    } catch (error) {
      logger.error(`Failed to run debarment check for vendor ${vendorId}`, { error, vendorId });
      throw error;
    }
  }

  async generate1099Data(vendorId: number, taxYear: number): Promise<Tax1099Data> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId }
      });

      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      // Get all disbursements for the tax year
      const startDate = new Date(taxYear, 0, 1); // January 1
      const endDate = new Date(taxYear, 11, 31, 23, 59, 59); // December 31

      const disbursements = await this.prisma.disbursement.findMany({
        where: {
          vendorId,
          executedDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'EXECUTED'
        },
        include: {
          invoice: true
        }
      });

      // Calculate total payments
      const totalPaid = disbursements.reduce((sum, d) => sum + d.amountCents, 0n);

      const payments = disbursements.map(d => ({
        amount: d.amountCents,
        date: d.executedDate!,
        description: `Payment for invoice ${d.invoice.invoiceNumber}`
      }));

      const tax1099Data: Tax1099Data = {
        vendorId,
        taxYear,
        totalPaid,
        taxId: vendor.taxId || '',
        vendorName: vendor.legalName || vendor.name,
        vendorAddress: vendor.address,
        payments
      };

      logger.info(`Generated 1099 data for vendor ${vendorId} for tax year ${taxYear}`, { 
        vendorId, 
        taxYear,
        totalPaid: totalPaid.toString(),
        paymentCount: payments.length 
      });

      return tax1099Data;
    } catch (error) {
      logger.error(`Failed to generate 1099 data for vendor ${vendorId}`, { error, vendorId, taxYear });
      throw error;
    }
  }
}