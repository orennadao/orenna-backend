import { PrismaClient, VerificationMethod, VerificationResult, VerificationStatus, EvidenceFile } from '@orenna/db';
import { FastifyBaseLogger } from 'fastify';
import crypto from 'crypto';
import { IPFSClient } from './ipfs-client.js';
import { EvidenceValidationPipeline } from './verification/evidence-pipeline.js';
import { QueueService } from './queue-service.js';

export interface VerificationServiceConfig {
  ipfsGatewayUrl?: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  confidenceThreshold: number;
}

export interface VerificationRequest {
  liftTokenId: number;
  methodId: string;
  validatorAddress: string;
  validatorName?: string;
  notes?: string;
  evidence?: EvidenceSubmission[];
}

export interface EvidenceSubmission {
  evidenceType: string;
  fileName: string;
  fileContent: Buffer;
  mimeType: string;
  captureDate?: Date;
  captureLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  captureDevice?: string;
  metadata?: Record<string, any>;
}

export interface VerificationCalculation {
  verified: boolean;
  confidenceScore: number;
  calculationData: Record<string, any>;
  evidenceHash: string;
  notes?: string;
}

export interface MethodologyHandler {
  methodId: string;
  validate(request: VerificationRequest, evidence: EvidenceFile[]): Promise<VerificationCalculation>;
  getRequiredEvidenceTypes(): string[];
  getMinimumConfidence(): number;
}

export class VerificationService {
  private prisma: PrismaClient;
  private logger: FastifyBaseLogger;
  private config: VerificationServiceConfig;
  private methodologyHandlers: Map<string, MethodologyHandler> = new Map();
  private ipfsClient?: IPFSClient;
  private evidencePipeline: EvidenceValidationPipeline;
  private queueService?: QueueService;

  constructor(
    prisma: PrismaClient, 
    logger: FastifyBaseLogger, 
    config: VerificationServiceConfig,
    ipfsClient?: IPFSClient,
    queueService?: QueueService
  ) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = config;
    this.ipfsClient = ipfsClient;
    this.queueService = queueService;
    this.evidencePipeline = new EvidenceValidationPipeline(prisma, logger, ipfsClient);
  }

  /**
   * Register a methodology handler
   */
  registerMethodology(handler: MethodologyHandler) {
    this.methodologyHandlers.set(handler.methodId, handler);
    this.logger.info({ methodId: handler.methodId }, 'Registered verification methodology');
  }

  /**
   * Submit a verification request
   */
  async submitVerification(request: VerificationRequest): Promise<VerificationResult> {
    this.logger.info({ 
      liftTokenId: request.liftTokenId, 
      methodId: request.methodId 
    }, 'Processing verification request');

    // Validate lift token exists
    const liftToken = await this.prisma.liftToken.findUnique({
      where: { id: request.liftTokenId }
    });

    if (!liftToken) {
      throw new Error(`Lift token ${request.liftTokenId} not found`);
    }

    // Validate verification method exists and is active
    const method = await this.prisma.verificationMethod.findUnique({
      where: { methodId: request.methodId }
    });

    if (!method || !method.active) {
      throw new Error(`Verification method ${request.methodId} not found or inactive`);
    }

    // Check if verification already exists
    const existingVerification = await this.prisma.verificationResult.findFirst({
      where: {
        liftTokenId: request.liftTokenId,
        methodId: request.methodId,
        status: { in: ['PENDING', 'IN_REVIEW', 'VERIFIED'] }
      }
    });

    if (existingVerification) {
      throw new Error('Verification already exists for this lift token and method');
    }

    // Create verification result
    const verificationResult = await this.prisma.verificationResult.create({
      data: {
        liftTokenId: request.liftTokenId,
        methodId: request.methodId,
        verified: false,
        status: VerificationStatus.PENDING,
        validatorAddress: request.validatorAddress,
        validatorName: request.validatorName,
        verificationDate: new Date(),
        notes: request.notes,
        submittedAt: new Date()
      }
    });

    // Process evidence if provided
    if (request.evidence && request.evidence.length > 0) {
      await this.processEvidence(verificationResult.id, request.evidence, request.validatorAddress);
    }

    // Create lift token event
    await this.prisma.liftTokenEvent.create({
      data: {
        liftTokenId: request.liftTokenId,
        type: 'VERIFICATION_SUBMITTED',
        payload: {
          verificationResultId: verificationResult.id,
          methodId: request.methodId,
          validatorAddress: request.validatorAddress
        },
        eventAt: new Date()
      }
    });

    this.logger.info({ 
      verificationResultId: verificationResult.id,
      liftTokenId: request.liftTokenId 
    }, 'Verification request submitted');

    return verificationResult;
  }

  /**
   * Process and store evidence files
   */
  async processEvidence(
    verificationResultId: number, 
    evidenceSubmissions: EvidenceSubmission[],
    uploadedBy: string
  ): Promise<EvidenceFile[]> {
    const evidenceFiles: EvidenceFile[] = [];
    const fileContentMap = new Map<number, Buffer>();

    for (const submission of evidenceSubmissions) {
      // Validate file size
      if (submission.fileContent.length > this.config.maxFileSize) {
        throw new Error(`File ${submission.fileName} exceeds maximum size limit`);
      }

      // Validate MIME type
      if (!this.config.allowedMimeTypes.includes(submission.mimeType)) {
        throw new Error(`File type ${submission.mimeType} not allowed`);
      }

      // Calculate file hash
      const fileHash = crypto
        .createHash('sha256')
        .update(submission.fileContent)
        .digest('hex');

      // Create evidence file record
      const evidenceFile = await this.prisma.evidenceFile.create({
        data: {
          verificationResultId,
          evidenceType: submission.evidenceType,
          fileName: submission.fileName,
          originalFileName: submission.fileName,
          fileHash,
          fileSize: BigInt(submission.fileContent.length),
          mimeType: submission.mimeType,
          captureDate: submission.captureDate,
          captureLocation: submission.captureLocation as any,
          captureDevice: submission.captureDevice,
          uploadedBy,
          metadata: submission.metadata,
          processed: false,
          verified: false
        }
      });

      evidenceFiles.push(evidenceFile);
      
      // Store file content for pipeline processing
      fileContentMap.set(evidenceFile.id, submission.fileContent);
    }

    // Process evidence files through validation pipeline (including IPFS upload)
    if (this.queueService) {
      // Queue evidence processing job for async handling
      await this.queueService.addEvidenceProcessingJob({
        verificationResultId,
        evidenceFileIds: evidenceFiles.map(e => e.id)
      }, {
        priority: 5,
        delay: 1000 // 1 second delay to ensure database consistency
      });

      this.logger.info({
        verificationResultId,
        evidenceFileCount: evidenceFiles.length
      }, 'Evidence processing queued for async execution');
    } else {
      // Synchronous processing fallback
      const processingResult = await this.evidencePipeline.processEvidence(
        verificationResultId,
        fileContentMap
      );

      this.logger.info({
        verificationResultId,
        processed: processingResult.processed,
        overallScore: processingResult.overallScore,
        qualityGrade: processingResult.qualityGrade,
        issuesCount: processingResult.issues.length
      }, 'Evidence processing completed synchronously');
    }

    // Create evidence upload event
    await this.prisma.liftTokenEvent.create({
      data: {
        liftTokenId: (await this.prisma.verificationResult.findUnique({
          where: { id: verificationResultId },
          select: { liftTokenId: true }
        }))!.liftTokenId,
        type: 'EVIDENCE_UPLOADED',
        payload: {
          verificationResultId,
          evidenceCount: evidenceFiles.length,
          evidenceTypes: evidenceSubmissions.map(e => e.evidenceType),
          processingResult: {
            processed: processingResult.processed,
            overallScore: processingResult.overallScore,
            qualityGrade: processingResult.qualityGrade,
            issuesCount: processingResult.issues.length
          }
        },
        eventAt: new Date()
      }
    });

    return evidenceFiles;
  }

  /**
   * Queue verification job for async processing
   */
  async queueVerificationJob(
    verificationResultId: number,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    delay?: number
  ): Promise<boolean> {
    if (!this.queueService) {
      this.logger.warn('Queue service not available for async verification');
      return false;
    }

    try {
      const verificationResult = await this.prisma.verificationResult.findUnique({
        where: { id: verificationResultId }
      });

      if (!verificationResult) {
        throw new Error(`Verification result not found: ${verificationResultId}`);
      }

      await this.queueService.addVerificationJob({
        verificationResultId,
        methodId: verificationResult.methodId,
        liftTokenId: verificationResult.liftTokenId,
        priority
      }, {
        delay: delay || 0
      });

      this.logger.info({
        verificationResultId,
        priority,
        delay
      }, 'Verification job queued');

      return true;
    } catch (error) {
      this.logger.error({
        verificationResultId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to queue verification job');
      return false;
    }
  }

  /**
   * Perform verification calculation using appropriate methodology
   */
  async performVerification(verificationResultId: number): Promise<VerificationResult> {
    const verificationResult = await this.prisma.verificationResult.findUnique({
      where: { id: verificationResultId },
      include: {
        evidenceFiles: true,
        verificationMethod: true,
        liftToken: true
      }
    });

    if (!verificationResult) {
      throw new Error('Verification result not found');
    }

    // Get methodology handler
    const handler = this.methodologyHandlers.get(verificationResult.methodId);
    if (!handler) {
      throw new Error(`No handler registered for methodology ${verificationResult.methodId}`);
    }

    // Update status to in review
    await this.prisma.verificationResult.update({
      where: { id: verificationResultId },
      data: { status: VerificationStatus.IN_REVIEW }
    });

    try {
      // Perform verification calculation
      const calculation = await handler.validate({
        liftTokenId: verificationResult.liftTokenId,
        methodId: verificationResult.methodId,
        validatorAddress: verificationResult.validatorAddress,
        validatorName: verificationResult.validatorName || undefined,
        notes: verificationResult.notes || undefined
      }, verificationResult.evidenceFiles);

      // Update verification result
      const updatedResult = await this.prisma.verificationResult.update({
        where: { id: verificationResultId },
        data: {
          verified: calculation.verified,
          confidenceScore: calculation.confidenceScore,
          evidenceHash: calculation.evidenceHash,
          calculationData: calculation.calculationData,
          status: calculation.verified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED,
          notes: calculation.notes || verificationResult.notes
        }
      });

      // Update lift token if verified
      if (calculation.verified) {
        await this.prisma.liftToken.update({
          where: { id: verificationResult.liftTokenId },
          data: {
            verificationMethodId: verificationResult.methodId,
            verifiedAt: new Date()
          }
        });
      }

      // Create verification event
      await this.prisma.liftTokenEvent.create({
        data: {
          liftTokenId: verificationResult.liftTokenId,
          type: calculation.verified ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          payload: {
            verificationResultId,
            verified: calculation.verified,
            confidenceScore: calculation.confidenceScore,
            methodId: verificationResult.methodId
          },
          eventAt: new Date()
        }
      });

      this.logger.info({
        verificationResultId,
        verified: calculation.verified,
        confidenceScore: calculation.confidenceScore
      }, 'Verification completed');

      return updatedResult;

    } catch (error) {
      // Update status to rejected on error
      await this.prisma.verificationResult.update({
        where: { id: verificationResultId },
        data: { 
          status: VerificationStatus.REJECTED,
          notes: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });

      throw error;
    }
  }

  /**
   * Get verification status for a lift token
   */
  async getVerificationStatus(liftTokenId: number): Promise<{
    verified: boolean;
    results: VerificationResult[];
    pending: VerificationResult[];
  }> {
    const results = await this.prisma.verificationResult.findMany({
      where: { liftTokenId },
      include: {
        verificationMethod: true,
        evidenceFiles: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const verified = results.some(r => r.status === VerificationStatus.VERIFIED);
    const pending = results.filter(r => 
      [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW].includes(r.status)
    );

    return {
      verified,
      results,
      pending
    };
  }

  /**
   * List available verification methods
   */
  async getVerificationMethods(filters?: {
    methodologyType?: string;
    active?: boolean;
    chainId?: number;
  }): Promise<VerificationMethod[]> {
    const where: any = {};
    
    if (filters?.methodologyType) {
      where.methodologyType = filters.methodologyType;
    }
    
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    
    if (filters?.chainId) {
      where.chainId = filters.chainId;
    }

    return this.prisma.verificationMethod.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Register a new verification method
   */
  async registerVerificationMethod(methodData: {
    methodId: string;
    name: string;
    description?: string;
    methodologyType: string;
    version?: string;
    criteria: Record<string, any>;
    requiredDataTypes?: string[];
    minimumConfidence?: number;
    validationPeriod?: number;
    registryContract?: string;
    chainId?: number;
    methodHash?: string;
    approvedValidators?: string[];
    metadata?: Record<string, any>;
  }): Promise<VerificationMethod> {
    return this.prisma.verificationMethod.create({
      data: {
        ...methodData,
        requiredDataTypes: methodData.requiredDataTypes as any,
        approvedValidators: methodData.approvedValidators as any,
        metadata: methodData.metadata as any
      }
    });
  }

  /**
   * Calculate evidence integrity hash
   */
  calculateEvidenceHash(evidenceFiles: EvidenceFile[]): string {
    const hashes = evidenceFiles
      .sort((a, b) => a.id - b.id)
      .map(f => f.fileHash);
    
    return crypto
      .createHash('sha256')
      .update(hashes.join(''))
      .digest('hex');
  }
}