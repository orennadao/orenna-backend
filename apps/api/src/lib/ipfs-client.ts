import { create, IPFSHTTPClient } from 'kubo-rpc-client';
import { FastifyBaseLogger } from 'fastify';
import { CID } from 'multiformats/cid';
import crypto from 'crypto';

export interface IPFSUploadResult {
  cid: string;
  hash: string;
  size: number;
  path: string;
}

export interface IPFSRetrieveResult {
  content: Buffer;
  cid: string;
  verified: boolean;
}

export interface IPFSClientConfig {
  url?: string;
  timeout?: number;
  retries?: number;
}

/**
 * IPFS Client for Evidence File Storage
 * Provides secure, decentralized storage for verification evidence
 */
export class IPFSClient {
  private client: IPFSHTTPClient;
  private logger: FastifyBaseLogger;
  private config: Required<IPFSClientConfig>;

  constructor(logger: FastifyBaseLogger, config: IPFSClientConfig = {}) {
    this.logger = logger;
    this.config = {
      url: config.url || process.env.IPFS_API_URL || 'http://localhost:5001',
      timeout: config.timeout || 30000, // 30 seconds
      retries: config.retries || 3
    };

    this.client = create({
      url: this.config.url,
      timeout: this.config.timeout
    });

    this.logger.info({ 
      ipfsUrl: this.config.url,
      timeout: this.config.timeout
    }, 'IPFS client initialized');
  }

  /**
   * Upload evidence file to IPFS
   */
  async uploadEvidenceFile(
    content: Buffer,
    fileName: string,
    metadata?: Record<string, any>
  ): Promise<IPFSUploadResult> {
    this.logger.info({ fileName, size: content.length }, 'Uploading evidence file to IPFS');

    try {
      // Calculate file hash for integrity verification
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // Prepare file with metadata
      const fileWithMetadata = {
        path: fileName,
        content,
        mode: 0o644, // Read-write for owner, read-only for others
        mtime: new Date()
      };

      // Add file to IPFS with metadata
      const results = [];
      for await (const result of this.client.addAll([fileWithMetadata], {
        pin: true, // Pin to ensure persistence
        wrapWithDirectory: false,
        cidVersion: 1, // Use CIDv1 for better compatibility
        progress: (bytes) => {
          this.logger.debug({ fileName, bytes }, 'Upload progress');
        }
      })) {
        results.push(result);
      }

      if (results.length === 0) {
        throw new Error('No results returned from IPFS upload');
      }

      const uploadResult = results[0];
      const cid = uploadResult.cid.toString();

      // Add metadata as separate file if provided
      if (metadata) {
        const metadataContent = Buffer.from(JSON.stringify({
          fileName,
          originalHash: hash,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }, null, 2));

        const metadataResults = [];
        for await (const result of this.client.addAll([{
          path: `${fileName}.metadata.json`,
          content: metadataContent
        }], {
          pin: true,
          cidVersion: 1
        })) {
          metadataResults.push(result);
        }

        this.logger.info({
          fileName,
          metadataCid: metadataResults[0]?.cid.toString()
        }, 'Uploaded metadata to IPFS');
      }

      this.logger.info({
        fileName,
        cid,
        hash,
        size: uploadResult.size
      }, 'Evidence file uploaded to IPFS successfully');

      return {
        cid,
        hash,
        size: uploadResult.size,
        path: uploadResult.path
      };

    } catch (error) {
      this.logger.error({
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to upload evidence file to IPFS');
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve evidence file from IPFS
   */
  async retrieveEvidenceFile(cid: string, expectedHash?: string): Promise<IPFSRetrieveResult> {
    this.logger.info({ cid, expectedHash }, 'Retrieving evidence file from IPFS');

    try {
      // Validate CID format
      try {
        CID.parse(cid);
      } catch (error) {
        throw new Error(`Invalid CID format: ${cid}`);
      }

      const chunks: Uint8Array[] = [];
      
      // Retrieve file from IPFS with timeout and retry logic
      let attempt = 0;
      while (attempt < this.config.retries) {
        try {
          for await (const chunk of this.client.cat(cid, {
            timeout: this.config.timeout
          })) {
            chunks.push(chunk);
          }
          break; // Success, exit retry loop
        } catch (error) {
          attempt++;
          if (attempt >= this.config.retries) {
            throw error;
          }
          
          this.logger.warn({
            cid,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'IPFS retrieval attempt failed, retrying');
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (chunks.length === 0) {
        throw new Error('No content retrieved from IPFS');
      }

      // Combine chunks into buffer
      const content = Buffer.concat(chunks);

      // Verify file integrity if expected hash provided
      let verified = true;
      if (expectedHash) {
        const actualHash = crypto.createHash('sha256').update(content).digest('hex');
        verified = actualHash === expectedHash;
        
        if (!verified) {
          this.logger.error({
            cid,
            expectedHash,
            actualHash
          }, 'File integrity verification failed');
        }
      }

      this.logger.info({
        cid,
        size: content.length,
        verified
      }, 'Evidence file retrieved from IPFS successfully');

      return {
        content,
        cid,
        verified
      };

    } catch (error) {
      this.logger.error({
        cid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to retrieve evidence file from IPFS');
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin evidence file to ensure persistence
   */
  async pinEvidenceFile(cid: string): Promise<void> {
    this.logger.info({ cid }, 'Pinning evidence file in IPFS');

    try {
      await this.client.pin.add(cid);
      
      this.logger.info({ cid }, 'Evidence file pinned successfully');
    } catch (error) {
      this.logger.error({
        cid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to pin evidence file');
      throw new Error(`IPFS pin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unpin evidence file (use with caution)
   */
  async unpinEvidenceFile(cid: string): Promise<void> {
    this.logger.info({ cid }, 'Unpinning evidence file from IPFS');

    try {
      await this.client.pin.rm(cid);
      
      this.logger.info({ cid }, 'Evidence file unpinned successfully');
    } catch (error) {
      this.logger.error({
        cid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to unpin evidence file');
      throw new Error(`IPFS unpin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get IPFS node status and connectivity
   */
  async getStatus(): Promise<{ connected: boolean; peersCount: number; version?: string }> {
    try {
      const [id, peers] = await Promise.all([
        this.client.id(),
        this.client.swarm.peers()
      ]);

      return {
        connected: true,
        peersCount: peers.length,
        version: id.agentVersion
      };
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to get IPFS status');
      
      return {
        connected: false,
        peersCount: 0
      };
    }
  }

  /**
   * Check if file exists in IPFS
   */
  async fileExists(cid: string): Promise<boolean> {
    try {
      const stat = await this.client.object.stat(cid);
      return stat !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file statistics from IPFS
   */
  async getFileStats(cid: string): Promise<{ size: number; type: string } | null> {
    try {
      const stat = await this.client.object.stat(cid);
      return {
        size: stat.CumulativeSize,
        type: 'file'
      };
    } catch (error) {
      this.logger.error({
        cid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to get file stats from IPFS');
      return null;
    }
  }

  /**
   * Cleanup and close IPFS client
   */
  async close(): Promise<void> {
    // Note: kubo-rpc-client doesn't require explicit cleanup
    // This method is provided for consistency and future extensibility
    this.logger.info('IPFS client closed');
  }
}

/**
 * Create IPFS client instance
 */
export function createIPFSClient(
  logger: FastifyBaseLogger,
  config?: IPFSClientConfig
): IPFSClient {
  return new IPFSClient(logger, config);
}