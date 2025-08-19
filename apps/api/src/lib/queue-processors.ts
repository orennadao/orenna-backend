import { Job } from 'bull';
import { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@orenna/db';
import { 
  QueueService, 
  VerificationJobData, 
  EvidenceProcessingJobData, 
  WebhookJobData 
} from './queue-service.js';
import { VerificationService } from './verification.js';
import { createIPFSClient } from './ipfs-client.js';

export interface QueueProcessorConfig {
  prisma: PrismaClient;
  logger: FastifyBaseLogger;
  queueService: QueueService;
  verificationService: VerificationService;
  webhookTimeout?: number;
  maxRetries?: number;
}

/**
 * Queue Processors for Background Verification Tasks
 */
export class QueueProcessors {
  private config: QueueProcessorConfig;
  private logger: FastifyBaseLogger;
  private prisma: PrismaClient;
  private queueService: QueueService;
  private verificationService: VerificationService;

  constructor(config: QueueProcessorConfig) {
    this.config = config;
    this.logger = config.logger;
    this.prisma = config.prisma;
    this.queueService = config.queueService;
    this.verificationService = config.verificationService;
    
    this.initializeProcessors();
  }

  /**
   * Initialize all queue processors
   */
  private initializeProcessors() {
    // Verification processing
    this.queueService.processQueue<VerificationJobData>(
      'verification',
      this.processVerificationJob.bind(this),
      3 // Concurrency for verification jobs
    );

    // Evidence processing
    this.queueService.processQueue<EvidenceProcessingJobData>(
      'evidence',
      this.processEvidenceJob.bind(this),
      5 // Higher concurrency for evidence processing
    );

    // Webhook notifications
    this.queueService.processQueue<WebhookJobData>(
      'webhooks',
      this.processWebhookJob.bind(this),
      10 // High concurrency for webhooks
    );

    // Cleanup tasks
    this.queueService.processQueue(
      'cleanup',
      this.processCleanupJob.bind(this),
      1 // Single worker for cleanup
    );

    this.logger.info('Queue processors initialized');
  }

  /**
   * Process verification calculation job
   */
  async processVerificationJob(job: Job<VerificationJobData>): Promise<any> {
    const { verificationResultId, methodId, liftTokenId, metadata } = job.data;
    
    this.logger.info({
      jobId: job.id,
      verificationResultId,
      methodId,
      liftTokenId
    }, 'Processing verification job');

    try {
      // Update job progress
      await job.progress(10);

      // Get verification result with evidence
      const verificationResult = await this.prisma.verificationResult.findUnique({
        where: { id: verificationResultId },
        include: {
          evidenceFiles: true,
          verificationMethod: true,
          liftToken: true
        }
      });

      if (!verificationResult) {
        throw new Error(`Verification result not found: ${verificationResultId}`);
      }

      await job.progress(30);

      // Check if evidence is processed
      const unprocessedEvidence = verificationResult.evidenceFiles.filter(e => !e.processed);
      if (unprocessedEvidence.length > 0) {
        this.logger.info({
          verificationResultId,
          unprocessedCount: unprocessedEvidence.length
        }, 'Waiting for evidence processing to complete');
        
        // Delay and retry
        throw new Error('Evidence processing not complete, will retry');
      }

      await job.progress(50);

      // Perform verification calculation
      const calculationResult = await this.verificationService.performVerification(verificationResultId);

      await job.progress(80);

      // Send notifications if verification completed
      if (calculationResult.verified) {
        await this.sendVerificationCompletedNotifications(verificationResult, calculationResult);
      }

      await job.progress(100);

      this.logger.info({
        jobId: job.id,
        verificationResultId,
        verified: calculationResult.verified,
        confidenceScore: calculationResult.confidenceScore
      }, 'Verification job completed');

      return {
        verificationResultId,
        verified: calculationResult.verified,
        confidenceScore: calculationResult.confidenceScore,
        processingTime: Date.now() - job.timestamp
      };

    } catch (error) {
      this.logger.error({
        jobId: job.id,
        verificationResultId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 'Verification job failed');

      // Update verification result status on failure
      await this.prisma.verificationResult.update({
        where: { id: verificationResultId },
        data: {
          status: 'FAILED',
          notes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });

      throw error;
    }
  }

  /**
   * Process evidence validation and IPFS upload job
   */
  async processEvidenceJob(job: Job<EvidenceProcessingJobData>): Promise<any> {
    const { verificationResultId, evidenceFileIds } = job.data;
    
    this.logger.info({
      jobId: job.id,
      verificationResultId,
      evidenceFileCount: evidenceFileIds.length
    }, 'Processing evidence job');

    try {
      await job.progress(10);

      // Get evidence files
      const evidenceFiles = await this.prisma.evidenceFile.findMany({
        where: {
          id: { in: evidenceFileIds },
          verificationResultId
        }
      });

      if (evidenceFiles.length === 0) {
        throw new Error('No evidence files found');
      }

      await job.progress(30);

      // Create IPFS client for file storage
      const ipfsClient = createIPFSClient(this.logger);

      // Process each evidence file
      const processedFiles = [];
      for (let i = 0; i < evidenceFiles.length; i++) {
        const evidence = evidenceFiles[i];
        
        try {
          // For demo purposes, we'll mark as processed
          // In real implementation, you'd retrieve file content and process
          await this.prisma.evidenceFile.update({
            where: { id: evidence.id },
            data: {
              processed: true,
              verified: true,
              verifiedAt: new Date()
            }
          });

          processedFiles.push(evidence.id);
          
          // Update progress
          await job.progress(30 + (i + 1) / evidenceFiles.length * 50);

        } catch (error) {
          this.logger.error({
            evidenceFileId: evidence.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'Failed to process evidence file');
          
          await this.prisma.evidenceFile.update({
            where: { id: evidence.id },
            data: {
              processed: true,
              verified: false,
              processingError: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }

      await job.progress(90);

      // Trigger verification job if all evidence is processed
      const allEvidence = await this.prisma.evidenceFile.findMany({
        where: { verificationResultId }
      });

      const allProcessed = allEvidence.every(e => e.processed);
      if (allProcessed) {
        // Queue verification job
        const verificationResult = await this.prisma.verificationResult.findUnique({
          where: { id: verificationResultId }
        });

        if (verificationResult) {
          await this.queueService.addVerificationJob({
            verificationResultId,
            methodId: verificationResult.methodId,
            liftTokenId: verificationResult.liftTokenId,
            priority: 'normal'
          }, {
            delay: 5000 // 5 second delay to ensure database consistency
          });
        }
      }

      await job.progress(100);

      this.logger.info({
        jobId: job.id,
        verificationResultId,
        processedCount: processedFiles.length,
        totalCount: evidenceFiles.length
      }, 'Evidence job completed');

      return {
        verificationResultId,
        processedFiles,
        allProcessed,
        processingTime: Date.now() - job.timestamp
      };

    } catch (error) {
      this.logger.error({
        jobId: job.id,
        verificationResultId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Evidence job failed');

      throw error;
    }
  }

  /**
   * Process webhook notification job
   */
  async processWebhookJob(job: Job<WebhookJobData>): Promise<any> {
    const { url, payload, headers } = job.data;
    
    this.logger.info({
      jobId: job.id,
      url,
      payloadSize: JSON.stringify(payload).length
    }, 'Processing webhook job');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Orenna-Verification-System/1.0',
          ...headers
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.webhookTimeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      this.logger.info({
        jobId: job.id,
        url,
        status: response.status,
        responseSize: responseText.length
      }, 'Webhook job completed');

      return {
        url,
        status: response.status,
        response: responseText,
        processingTime: Date.now() - job.timestamp
      };

    } catch (error) {
      this.logger.error({
        jobId: job.id,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Webhook job failed');

      throw error;
    }
  }

  /**
   * Process cleanup job
   */
  async processCleanupJob(job: Job): Promise<any> {
    const data = job.data;
    
    this.logger.info({
      jobId: job.id,
      cleanupType: data.type
    }, 'Processing cleanup job');

    try {
      switch (data.type) {
        case 'expired_verifications':
          return await this.cleanupExpiredVerifications();
          
        case 'old_evidence_files':
          return await this.cleanupOldEvidenceFiles(data.olderThanDays || 90);
          
        case 'failed_jobs':
          return await this.cleanupFailedJobs();
          
        default:
          throw new Error(`Unknown cleanup type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error({
        jobId: job.id,
        cleanupType: data.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Cleanup job failed');

      throw error;
    }
  }

  /**
   * Send verification completed notifications
   */
  private async sendVerificationCompletedNotifications(
    verificationResult: any,
    calculationResult: any
  ): Promise<void> {
    try {
      // Create lift token event
      await this.prisma.liftTokenEvent.create({
        data: {
          liftTokenId: verificationResult.liftTokenId,
          type: 'VERIFICATION_APPROVED',
          payload: {
            verificationResultId: verificationResult.id,
            methodId: verificationResult.methodId,
            verified: calculationResult.verified,
            confidenceScore: calculationResult.confidenceScore
          },
          eventAt: new Date()
        }
      });

      // TODO: Send webhook notifications to registered endpoints
      // This would integrate with external systems
      
    } catch (error) {
      this.logger.error({
        verificationResultId: verificationResult.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to send verification notifications');
    }
  }

  /**
   * Cleanup expired verification results
   */
  private async cleanupExpiredVerifications(): Promise<{ cleaned: number }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await this.prisma.verificationResult.updateMany({
      where: {
        status: 'PENDING',
        submittedAt: {
          lt: thirtyDaysAgo
        }
      },
      data: {
        status: 'EXPIRED',
        notes: 'Verification expired due to inactivity'
      }
    });

    this.logger.info({ cleaned: result.count }, 'Expired verifications cleaned up');
    return { cleaned: result.count };
  }

  /**
   * Cleanup old evidence files
   */
  private async cleanupOldEvidenceFiles(olderThanDays: number): Promise<{ cleaned: number }> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    // In a real implementation, you'd also clean up IPFS files
    const result = await this.prisma.evidenceFile.deleteMany({
      where: {
        uploadedAt: {
          lt: cutoffDate
        },
        verified: false // Only delete unverified old files
      }
    });

    this.logger.info({ 
      cleaned: result.count,
      olderThanDays 
    }, 'Old evidence files cleaned up');
    
    return { cleaned: result.count };
  }

  /**
   * Cleanup failed jobs from queues
   */
  private async cleanupFailedJobs(): Promise<{ cleaned: Record<string, number> }> {
    const results: Record<string, number> = {};
    const queues = ['verification', 'evidence', 'webhooks'];
    
    for (const queueName of queues) {
      const cleaned = await this.queueService.cleanQueue(
        queueName,
        'failed',
        7 * 24 * 60 * 60 * 1000 // 7 days
      );
      results[queueName] = cleaned;
    }

    this.logger.info({ results }, 'Failed jobs cleaned up');
    return { cleaned: results };
  }
}

/**
 * Create queue processors instance
 */
export function createQueueProcessors(config: QueueProcessorConfig): QueueProcessors {
  return new QueueProcessors(config);
}