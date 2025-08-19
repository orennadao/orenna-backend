import Bull, { Queue, Job, JobOptions } from 'bull';
import { FastifyBaseLogger } from 'fastify';
import Redis from 'ioredis';

export interface QueueConfig {
  redisUrl?: string;
  redisOptions?: Redis.RedisOptions;
  defaultJobOptions?: JobOptions;
  concurrency?: number;
}

export interface VerificationJobData {
  verificationResultId: number;
  methodId: string;
  liftTokenId: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface EvidenceProcessingJobData {
  verificationResultId: number;
  evidenceFileIds: number[];
  retryCount?: number;
}

export interface WebhookJobData {
  url: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  retryCount?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

/**
 * Queue Service for Async Processing
 * Handles background verification tasks with Redis/Bull
 */
export class QueueService {
  private logger: FastifyBaseLogger;
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private config: Required<QueueConfig>;

  constructor(logger: FastifyBaseLogger, config: QueueConfig = {}) {
    this.logger = logger;
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      redisOptions: config.redisOptions || {},
      defaultJobOptions: config.defaultJobOptions || {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      concurrency: config.concurrency || 5
    };

    this.redis = new Redis(this.config.redisUrl, {
      ...this.config.redisOptions,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });

    this.setupRedisEventHandlers();
    this.initializeQueues();
  }

  /**
   * Setup Redis connection event handlers
   */
  private setupRedisEventHandlers() {
    this.redis.on('connect', () => {
      this.logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error({ error }, 'Redis connection error');
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Redis reconnecting...');
    });
  }

  /**
   * Initialize job queues
   */
  private initializeQueues() {
    // Verification processing queue
    this.createQueue('verification', {
      ...this.config.defaultJobOptions,
      priority: 10
    });

    // Evidence processing queue
    this.createQueue('evidence', {
      ...this.config.defaultJobOptions,
      priority: 5
    });

    // Webhook notifications queue
    this.createQueue('webhooks', {
      ...this.config.defaultJobOptions,
      attempts: 5,
      priority: 1
    });

    // Cleanup queue for maintenance tasks
    this.createQueue('cleanup', {
      ...this.config.defaultJobOptions,
      removeOnComplete: 10,
      removeOnFail: 10
    });

    this.logger.info({
      queues: Array.from(this.queues.keys())
    }, 'Job queues initialized');
  }

  /**
   * Create a new queue
   */
  private createQueue(name: string, defaultOptions: JobOptions): Queue {
    const queue = new Bull(name, {
      redis: {
        host: this.config.redisUrl.includes('://') 
          ? new URL(this.config.redisUrl).hostname 
          : this.config.redisUrl.split(':')[0],
        port: this.config.redisUrl.includes('://') 
          ? Number(new URL(this.config.redisUrl).port) || 6379
          : Number(this.config.redisUrl.split(':')[1]) || 6379,
        ...this.config.redisOptions
      },
      defaultJobOptions: defaultOptions
    });

    // Setup queue event handlers
    queue.on('completed', (job: Job, result: any) => {
      this.logger.info({
        queue: name,
        jobId: job.id,
        duration: Date.now() - job.timestamp,
        result
      }, 'Job completed successfully');
    });

    queue.on('failed', (job: Job, error: Error) => {
      this.logger.error({
        queue: name,
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        error: error.message,
        stack: error.stack
      }, 'Job failed');
    });

    queue.on('stalled', (job: Job) => {
      this.logger.warn({
        queue: name,
        jobId: job.id,
        processedOn: job.processedOn
      }, 'Job stalled');
    });

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Add verification job to queue
   */
  async addVerificationJob(
    data: VerificationJobData,
    options?: JobOptions
  ): Promise<Job<VerificationJobData>> {
    const queue = this.queues.get('verification');
    if (!queue) {
      throw new Error('Verification queue not initialized');
    }

    const priority = this.getPriorityValue(data.priority);
    const jobOptions = {
      ...options,
      priority,
      delay: options?.delay || 0
    };

    const job = await queue.add(data, jobOptions);
    
    this.logger.info({
      verificationResultId: data.verificationResultId,
      jobId: job.id,
      priority: data.priority,
      delay: jobOptions.delay
    }, 'Verification job queued');

    return job;
  }

  /**
   * Add evidence processing job to queue
   */
  async addEvidenceProcessingJob(
    data: EvidenceProcessingJobData,
    options?: JobOptions
  ): Promise<Job<EvidenceProcessingJobData>> {
    const queue = this.queues.get('evidence');
    if (!queue) {
      throw new Error('Evidence queue not initialized');
    }

    const job = await queue.add(data, options);
    
    this.logger.info({
      verificationResultId: data.verificationResultId,
      evidenceFileCount: data.evidenceFileIds.length,
      jobId: job.id
    }, 'Evidence processing job queued');

    return job;
  }

  /**
   * Add webhook notification job to queue
   */
  async addWebhookJob(
    data: WebhookJobData,
    options?: JobOptions
  ): Promise<Job<WebhookJobData>> {
    const queue = this.queues.get('webhooks');
    if (!queue) {
      throw new Error('Webhooks queue not initialized');
    }

    const job = await queue.add(data, options);
    
    this.logger.info({
      url: data.url,
      jobId: job.id
    }, 'Webhook job queued');

    return job;
  }

  /**
   * Add cleanup job to queue
   */
  async addCleanupJob(
    data: Record<string, any>,
    options?: JobOptions
  ): Promise<Job> {
    const queue = this.queues.get('cleanup');
    if (!queue) {
      throw new Error('Cleanup queue not initialized');
    }

    const job = await queue.add(data, {
      ...options,
      delay: options?.delay || 60000 // Default 1 minute delay
    });
    
    this.logger.info({
      jobId: job.id,
      data
    }, 'Cleanup job queued');

    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: await queue.isPaused()
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, QueueStats>> {
    const stats: Record<string, QueueStats> = {};
    
    for (const [name] of this.queues) {
      const queueStats = await this.getQueueStats(name);
      if (queueStats) {
        stats[name] = queueStats;
      }
    }
    
    return stats;
  }

  /**
   * Get job by ID from any queue
   */
  async getJob(queueName: string, jobId: string | number): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    return await queue.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: string, jobId: string | number): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return false;
    }

    try {
      await job.remove();
      this.logger.info({ queueName, jobId }, 'Job cancelled successfully');
      return true;
    } catch (error) {
      this.logger.error({ queueName, jobId, error }, 'Failed to cancel job');
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string | number): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return false;
    }

    try {
      await job.retry();
      this.logger.info({ queueName, jobId }, 'Job retry initiated');
      return true;
    } catch (error) {
      this.logger.error({ queueName, jobId, error }, 'Failed to retry job');
      return false;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    await queue.pause();
    this.logger.info({ queueName }, 'Queue paused');
    return true;
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    await queue.resume();
    this.logger.info({ queueName }, 'Queue resumed');
    return true;
  }

  /**
   * Clean completed/failed jobs from queue
   */
  async cleanQueue(
    queueName: string, 
    type: 'completed' | 'failed' | 'active' | 'waiting' = 'completed',
    olderThan: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return 0;
    }

    const cleaned = await queue.clean(olderThan, type);
    this.logger.info({ 
      queueName, 
      type, 
      cleaned: cleaned.length,
      olderThan 
    }, 'Queue cleaned');
    
    return cleaned.length;
  }

  /**
   * Process jobs in a queue with a processor function
   */
  processQueue<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency?: number
  ): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    queue.process(concurrency || this.config.concurrency, processor);
    
    this.logger.info({
      queueName,
      concurrency: concurrency || this.config.concurrency
    }, 'Queue processor started');
  }

  /**
   * Get priority value from string
   */
  private getPriorityValue(priority?: string): number {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 50;
      case 'normal': return 10;
      case 'low': return 1;
      default: return 10;
    }
  }

  /**
   * Close all queues and Redis connection
   */
  async close(): Promise<void> {
    this.logger.info('Closing queue service...');
    
    // Close all queues
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    
    // Close Redis connection
    await this.redis.quit();
    
    this.logger.info('Queue service closed');
  }

  /**
   * Health check for queue service
   */
  async healthCheck(): Promise<{ healthy: boolean; redis: boolean; queues: string[] }> {
    try {
      // Check Redis connection
      await this.redis.ping();
      
      return {
        healthy: true,
        redis: true,
        queues: Array.from(this.queues.keys())
      };
    } catch (error) {
      this.logger.error({ error }, 'Queue service health check failed');
      return {
        healthy: false,
        redis: false,
        queues: []
      };
    }
  }
}

/**
 * Create queue service instance
 */
export function createQueueService(
  logger: FastifyBaseLogger,
  config?: QueueConfig
): QueueService {
  return new QueueService(logger, config);
}

/**
 * Default redis instance for backwards compatibility
 */
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});