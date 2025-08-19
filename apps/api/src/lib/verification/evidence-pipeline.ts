import { EvidenceFile, PrismaClient } from '@orenna/db';
import { FastifyBaseLogger } from 'fastify';
import crypto from 'crypto';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';
import { IPFSClient } from '../ipfs-client.js';
import { FileParser, ParsedData } from '../file-parser.js';

const pipelineAsync = promisify(pipeline);

export interface EvidenceValidationRule {
  name: string;
  description: string;
  validate: (evidence: EvidenceFile, content?: Buffer) => Promise<ValidationResult>;
  required: boolean;
  evidenceTypes: string[];
}

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-1 quality score
  issues: ValidationIssue[];
  metadata?: Record<string, any>;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  suggestion?: string;
}

export interface EvidenceProcessingResult {
  processed: boolean;
  validationResults: ValidationResult[];
  overallScore: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: ValidationIssue[];
  ipfsCid?: string;
  processingTime: number;
}

/**
 * Evidence Validation Pipeline
 * Validates evidence files for verification requests
 */
export class EvidenceValidationPipeline {
  private prisma: PrismaClient;
  private logger: FastifyBaseLogger;
  private validationRules: Map<string, EvidenceValidationRule[]> = new Map();
  private ipfsClient?: IPFSClient;
  private fileParser: FileParser;

  constructor(prisma: PrismaClient, logger: FastifyBaseLogger, ipfsClient?: IPFSClient) {
    this.prisma = prisma;
    this.logger = logger;
    this.ipfsClient = ipfsClient;
    this.fileParser = new FileParser(logger);
    this.initializeValidationRules();
  }

  /**
   * Initialize standard validation rules
   */
  private initializeValidationRules() {
    // File integrity validation rules
    this.addValidationRule({
      name: 'file_integrity',
      description: 'Verify file hash and integrity',
      required: true,
      evidenceTypes: ['*'], // Applies to all evidence types
      validate: async (evidence: EvidenceFile, content?: Buffer) => {
        const issues: ValidationIssue[] = [];
        let score = 1.0;

        if (content) {
          // Verify file hash
          const calculatedHash = crypto.createHash('sha256').update(content).digest('hex');
          if (calculatedHash !== evidence.fileHash) {
            issues.push({
              severity: 'error',
              message: 'File hash mismatch - file may be corrupted',
              field: 'fileHash',
              suggestion: 'Re-upload the file'
            });
            score = 0;
          }

          // Verify file size
          if (content.length !== Number(evidence.fileSize)) {
            issues.push({
              severity: 'error',
              message: 'File size mismatch',
              field: 'fileSize'
            });
            score = 0;
          }
        }

        return {
          valid: issues.filter(i => i.severity === 'error').length === 0,
          score,
          issues
        };
      }
    });

    // Metadata completeness validation
    this.addValidationRule({
      name: 'metadata_completeness',
      description: 'Check required metadata fields',
      required: true,
      evidenceTypes: ['*'],
      validate: async (evidence: EvidenceFile) => {
        const issues: ValidationIssue[] = [];
        let score = 1.0;

        // Check basic metadata
        if (!evidence.captureDate) {
          issues.push({
            severity: 'warning',
            message: 'Missing capture date',
            field: 'captureDate',
            suggestion: 'Include when the evidence was captured'
          });
          score -= 0.2;
        }

        if (!evidence.captureDevice) {
          issues.push({
            severity: 'info',
            message: 'Missing capture device information',
            field: 'captureDevice',
            suggestion: 'Include device/sensor information for better traceability'
          });
          score -= 0.1;
        }

        // Check evidence-specific metadata
        if (!evidence.metadata || typeof evidence.metadata !== 'object') {
          issues.push({
            severity: 'warning',
            message: 'Missing or invalid metadata structure',
            field: 'metadata',
            suggestion: 'Include structured metadata relevant to evidence type'
          });
          score -= 0.3;
        }

        return {
          valid: issues.filter(i => i.severity === 'error').length === 0,
          score: Math.max(0, score),
          issues
        };
      }
    });

    // Water measurement data validation
    this.addValidationRule({
      name: 'water_data_validation',
      description: 'Validate water measurement data quality',
      required: true,
      evidenceTypes: ['WATER_MEASUREMENT_DATA', 'SENSOR_DATA'],
      validate: async (evidence: EvidenceFile) => {
        const issues: ValidationIssue[] = [];
        let score = 1.0;
        const metadata = evidence.metadata as any;

        if (!metadata) {
          return {
            valid: false,
            score: 0,
            issues: [{
              severity: 'error',
              message: 'No metadata found for water measurement data',
              suggestion: 'Include measurement values and parameters'
            }]
          };
        }

        // Check for required water measurement fields
        const requiredFields = ['waterVolume', 'measurementPeriod', 'units'];
        for (const field of requiredFields) {
          if (!(field in metadata)) {
            issues.push({
              severity: 'error',
              message: `Missing required field: ${field}`,
              field,
              suggestion: `Include ${field} in metadata`
            });
            score -= 0.3;
          }
        }

        // Validate data ranges
        if (metadata.waterVolume !== undefined) {
          if (typeof metadata.waterVolume !== 'number' || metadata.waterVolume < 0) {
            issues.push({
              severity: 'error',
              message: 'Invalid water volume value',
              field: 'waterVolume',
              suggestion: 'Water volume must be a positive number'
            });
            score -= 0.4;
          }
        }

        if (metadata.measurementPeriod !== undefined) {
          if (typeof metadata.measurementPeriod !== 'number' || metadata.measurementPeriod <= 0) {
            issues.push({
              severity: 'error',
              message: 'Invalid measurement period',
              field: 'measurementPeriod',
              suggestion: 'Measurement period must be a positive number'
            });
            score -= 0.3;
          }
        }

        // Check data quality indicators
        if (metadata.accuracy !== undefined) {
          if (typeof metadata.accuracy !== 'number' || metadata.accuracy < 0 || metadata.accuracy > 1) {
            issues.push({
              severity: 'warning',
              message: 'Invalid accuracy value',
              field: 'accuracy',
              suggestion: 'Accuracy should be between 0 and 1'
            });
            score -= 0.2;
          } else if (metadata.accuracy < 0.8) {
            issues.push({
              severity: 'warning',
              message: 'Low measurement accuracy',
              field: 'accuracy',
              suggestion: 'Consider improving measurement methods or equipment'
            });
            score -= 0.1;
          }
        }

        return {
          valid: issues.filter(i => i.severity === 'error').length === 0,
          score: Math.max(0, score),
          issues,
          metadata: {
            dataQualityScore: score,
            measuredParameters: Object.keys(metadata).filter(k => 
              ['waterVolume', 'flowRate', 'pressure', 'temperature'].includes(k)
            )
          }
        };
      }
    });

    // GPS coordinates validation
    this.addValidationRule({
      name: 'gps_validation',
      description: 'Validate GPS coordinates accuracy',
      required: true,
      evidenceTypes: ['GPS_COORDINATES', 'SITE_VERIFICATION'],
      validate: async (evidence: EvidenceFile) => {
        const issues: ValidationIssue[] = [];
        let score = 1.0;

        if (!evidence.captureLocation) {
          return {
            valid: false,
            score: 0,
            issues: [{
              severity: 'error',
              message: 'No GPS coordinates found',
              suggestion: 'Include latitude and longitude coordinates'
            }]
          };
        }

        const location = evidence.captureLocation as any;

        // Validate latitude
        if (typeof location.latitude !== 'number' || 
            location.latitude < -90 || location.latitude > 90) {
          issues.push({
            severity: 'error',
            message: 'Invalid latitude value',
            field: 'latitude',
            suggestion: 'Latitude must be between -90 and 90 degrees'
          });
          score -= 0.5;
        }

        // Validate longitude
        if (typeof location.longitude !== 'number' || 
            location.longitude < -180 || location.longitude > 180) {
          issues.push({
            severity: 'error',
            message: 'Invalid longitude value',
            field: 'longitude',
            suggestion: 'Longitude must be between -180 and 180 degrees'
          });
          score -= 0.5;
        }

        // Check GPS accuracy if available
        const metadata = evidence.metadata as any;
        if (metadata?.gpsAccuracy !== undefined) {
          if (typeof metadata.gpsAccuracy !== 'number' || metadata.gpsAccuracy < 0) {
            issues.push({
              severity: 'warning',
              message: 'Invalid GPS accuracy value',
              field: 'gpsAccuracy'
            });
            score -= 0.2;
          } else if (metadata.gpsAccuracy > 10) {
            issues.push({
              severity: 'warning',
              message: 'Low GPS accuracy',
              field: 'gpsAccuracy',
              suggestion: 'GPS accuracy should be better than 10 meters for verification'
            });
            score -= 0.1;
          }
        } else {
          issues.push({
            severity: 'info',
            message: 'GPS accuracy not provided',
            suggestion: 'Include GPS accuracy for better quality assessment'
          });
          score -= 0.05;
        }

        return {
          valid: issues.filter(i => i.severity === 'error').length === 0,
          score: Math.max(0, score),
          issues,
          metadata: {
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: metadata?.gpsAccuracy
            }
          }
        };
      }
    });

    // Document validation
    this.addValidationRule({
      name: 'document_validation',
      description: 'Validate document format and content',
      required: true,
      evidenceTypes: ['METHODOLOGY_DOCUMENTATION', 'FIELD_REPORT', 'CALCULATION_SHEET'],
      validate: async (evidence: EvidenceFile, content?: Buffer) => {
        const issues: ValidationIssue[] = [];
        let score = 1.0;

        // Check MIME type
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!evidence.mimeType || !allowedMimeTypes.includes(evidence.mimeType)) {
          issues.push({
            severity: 'warning',
            message: 'Document format may not be optimal for verification',
            field: 'mimeType',
            suggestion: 'Use PDF, Word, or Excel formats for better compatibility'
          });
          score -= 0.1;
        }

        // Check file size (documents should not be too large or too small)
        const fileSize = Number(evidence.fileSize);
        if (fileSize < 1024) { // Less than 1KB
          issues.push({
            severity: 'warning',
            message: 'Document file is very small',
            field: 'fileSize',
            suggestion: 'Ensure document contains sufficient information'
          });
          score -= 0.2;
        } else if (fileSize > 50 * 1024 * 1024) { // More than 50MB
          issues.push({
            severity: 'warning',
            message: 'Document file is very large',
            field: 'fileSize',
            suggestion: 'Consider compressing or splitting large documents'
          });
          score -= 0.1;
        }

        return {
          valid: issues.filter(i => i.severity === 'error').length === 0,
          score: Math.max(0, score),
          issues,
          metadata: {
            documentType: evidence.evidenceType,
            size: fileSize,
            format: evidence.mimeType
          }
        };
      }
    });
  }

  /**
   * Add a validation rule for specific evidence types
   */
  addValidationRule(rule: EvidenceValidationRule) {
    for (const evidenceType of rule.evidenceTypes) {
      if (!this.validationRules.has(evidenceType)) {
        this.validationRules.set(evidenceType, []);
      }
      this.validationRules.get(evidenceType)!.push(rule);
    }
    
    this.logger.info({ 
      ruleName: rule.name, 
      evidenceTypes: rule.evidenceTypes 
    }, 'Added evidence validation rule');
  }

  /**
   * Parse file content and extract structured data
   */
  async parseFileContent(
    evidence: EvidenceFile,
    content: Buffer
  ): Promise<ParsedData | null> {
    try {
      // Skip parsing for non-data files
      const dataFileTypes = [
        'WATER_MEASUREMENT_DATA',
        'BASELINE_ASSESSMENT', 
        'CALCULATION_SHEET',
        'SENSOR_DATA',
        'MEASUREMENT_LOG'
      ];
      
      if (!dataFileTypes.includes(evidence.evidenceType)) {
        this.logger.debug({
          evidenceType: evidence.evidenceType
        }, 'Skipping file parsing for non-data evidence type');
        return null;
      }

      const parsedData = await this.fileParser.parseFile(
        content,
        evidence.fileName,
        evidence.mimeType || 'application/octet-stream',
        {
          maxRows: 10000, // Limit to prevent memory issues
          encoding: 'utf8',
          csvOptions: {
            headers: true,
            skipEmptyLines: true
          },
          excelOptions: {
            sheetIndex: 0 // Use first sheet by default
          }
        }
      );

      // Extract VWBA-specific metadata
      const vwbaMetadata = this.fileParser.extractVWBAMetadata(parsedData);

      // Update evidence file with parsed metadata
      await this.prisma.evidenceFile.update({
        where: { id: evidence.id },
        data: {
          metadata: {
            ...evidence.metadata as any,
            parsedData: {
              format: parsedData.format,
              rowCount: parsedData.rowCount,
              columns: parsedData.columns,
              vwbaFields: vwbaMetadata
            }
          },
          processed: true
        }
      });

      this.logger.info({
        evidenceId: evidence.id,
        format: parsedData.format,
        rowCount: parsedData.rowCount,
        columns: parsedData.columns?.length || 0
      }, 'File content parsed successfully');

      return parsedData;

    } catch (error) {
      this.logger.error({
        evidenceId: evidence.id,
        fileName: evidence.fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to parse file content');
      
      // Don't throw error, just return null so validation can continue
      return null;
    }
  }

  /**
   * Upload evidence file to IPFS
   */
  async uploadEvidenceToIPFS(
    evidenceId: number,
    content: Buffer,
    fileName: string
  ): Promise<string | null> {
    if (!this.ipfsClient) {
      this.logger.warn('IPFS client not available, skipping file upload');
      return null;
    }

    try {
      // Get evidence metadata for IPFS upload
      const evidence = await this.prisma.evidenceFile.findUnique({
        where: { id: evidenceId }
      });

      if (!evidence) {
        throw new Error(`Evidence file not found: ${evidenceId}`);
      }

      const uploadResult = await this.ipfsClient.uploadEvidenceFile(
        content,
        fileName,
        {
          evidenceType: evidence.evidenceType,
          captureDate: evidence.captureDate?.toISOString(),
          captureDevice: evidence.captureDevice,
          captureLocation: evidence.captureLocation,
          originalHash: evidence.fileHash,
          fileSize: evidence.fileSize,
          mimeType: evidence.mimeType,
          metadata: evidence.metadata
        }
      );

      // Update database with IPFS CID
      await this.prisma.evidenceFile.update({
        where: { id: evidenceId },
        data: {
          ipfsCid: uploadResult.cid,
          uploadedAt: new Date()
        }
      });

      this.logger.info({
        evidenceId,
        fileName,
        cid: uploadResult.cid
      }, 'Evidence file uploaded to IPFS');

      return uploadResult.cid;

    } catch (error) {
      this.logger.error({
        evidenceId,
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to upload evidence to IPFS');
      return null;
    }
  }

  /**
   * Retrieve evidence file from IPFS
   */
  async retrieveEvidenceFromIPFS(cid: string, expectedHash?: string): Promise<Buffer | null> {
    if (!this.ipfsClient) {
      this.logger.warn('IPFS client not available');
      return null;
    }

    try {
      const result = await this.ipfsClient.retrieveEvidenceFile(cid, expectedHash);
      
      if (!result.verified && expectedHash) {
        this.logger.error({
          cid,
          expectedHash
        }, 'Evidence file integrity verification failed');
        return null;
      }

      return result.content;

    } catch (error) {
      this.logger.error({
        cid,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to retrieve evidence from IPFS');
      return null;
    }
  }

  /**
   * Process evidence files through validation pipeline
   */
  async processEvidence(
    verificationResultId: number,
    fileContent?: Map<number, Buffer>
  ): Promise<EvidenceProcessingResult> {
    const startTime = Date.now();
    
    this.logger.info({ verificationResultId }, 'Starting evidence processing');

    // Get evidence files
    const evidenceFiles = await this.prisma.evidenceFile.findMany({
      where: { verificationResultId }
    });

    if (evidenceFiles.length === 0) {
      return {
        processed: false,
        validationResults: [],
        overallScore: 0,
        qualityGrade: 'F',
        issues: [{
          severity: 'error',
          message: 'No evidence files found for verification'
        }],
        processingTime: Date.now() - startTime
      };
    }

    const allValidationResults: ValidationResult[] = [];
    const allIssues: ValidationIssue[] = [];

    // Process each evidence file
    for (const evidence of evidenceFiles) {
      try {
        const content = fileContent?.get(evidence.id);
        
        // Parse file content if available
        let parsedData: ParsedData | null = null;
        if (content) {
          parsedData = await this.parseFileContent(evidence, content);
        }
        
        const fileValidationResults = await this.validateEvidenceFile(
          evidence,
          content,
          parsedData
        );
        
        allValidationResults.push(...fileValidationResults);
        
        // Collect all issues
        for (const result of fileValidationResults) {
          allIssues.push(...result.issues);
        }

        // Upload to IPFS if content is available and validation passed
        let ipfsCid: string | null = null;
        if (content && fileValidationResults.every(r => r.valid)) {
          ipfsCid = await this.uploadEvidenceToIPFS(
            evidence.id,
            content,
            evidence.fileName
          );
        }

        // Update evidence file processing status
        await this.prisma.evidenceFile.update({
          where: { id: evidence.id },
          data: {
            processed: true,
            verified: fileValidationResults.every(r => r.valid),
            verifiedAt: new Date(),
            ...(ipfsCid && { ipfsCid })
          }
        });

      } catch (error) {
        this.logger.error({ 
          evidenceFileId: evidence.id, 
          error 
        }, 'Error processing evidence file');
        
        allIssues.push({
          severity: 'error',
          message: `Processing failed for ${evidence.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });

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

    // Calculate overall score and quality grade
    const overallScore = allValidationResults.length > 0 
      ? allValidationResults.reduce((sum, r) => sum + r.score, 0) / allValidationResults.length
      : 0;

    const qualityGrade = this.calculateQualityGrade(overallScore, allIssues);

    const processingTime = Date.now() - startTime;

    this.logger.info({
      verificationResultId,
      overallScore,
      qualityGrade,
      issueCount: allIssues.length,
      processingTime
    }, 'Evidence processing completed');

    return {
      processed: true,
      validationResults: allValidationResults,
      overallScore,
      qualityGrade,
      issues: allIssues,
      processingTime
    };
  }

  /**
   * Validate a single evidence file
   */
  private async validateEvidenceFile(
    evidence: EvidenceFile,
    content?: Buffer,
    parsedData?: ParsedData | null
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Get applicable validation rules
    const applicableRules = [
      ...(this.validationRules.get('*') || []),
      ...(this.validationRules.get(evidence.evidenceType) || [])
    ];

    // Run each validation rule
    for (const rule of applicableRules) {
      try {
        const result = await rule.validate(evidence, content);
        results.push({
          ...result,
          metadata: {
            ...result.metadata,
            ruleName: rule.name,
            ruleDescription: rule.description
          }
        });
      } catch (error) {
        this.logger.error({ 
          evidenceFileId: evidence.id, 
          ruleName: rule.name, 
          error 
        }, 'Validation rule failed');
        
        results.push({
          valid: false,
          score: 0,
          issues: [{
            severity: 'error',
            message: `Validation rule '${rule.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          metadata: {
            ruleName: rule.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    // Add parsed data validation if available
    if (parsedData) {
      const parsedDataValidation = await this.validateParsedData(evidence, parsedData);
      results.push(parsedDataValidation);
    }

    return results;
  }

  /**
   * Validate parsed data content
   */
  private async validateParsedData(evidence: EvidenceFile, parsedData: ParsedData): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    try {
      // Validate data format
      if (parsedData.format === 'unknown') {
        issues.push({
          severity: 'warning',
          message: 'File format could not be determined',
          suggestion: 'Ensure file is in a supported format (JSON, CSV, Excel)'
        });
        score -= 0.2;
      }

      // Validate data structure
      if (parsedData.rowCount === 0) {
        issues.push({
          severity: 'error',
          message: 'No data rows found in file',
          suggestion: 'Ensure file contains measurement data'
        });
        score = 0;
      } else if (parsedData.rowCount < 5) {
        issues.push({
          severity: 'warning',
          message: 'Very few data rows found',
          suggestion: 'Consider including more measurement data for better verification'
        });
        score -= 0.1;
      }

      // Validate columns for measurement data
      if (evidence.evidenceType === 'WATER_MEASUREMENT_DATA' || evidence.evidenceType === 'SENSOR_DATA') {
        const requiredColumns = ['volume', 'date', 'timestamp'];
        const commonColumns = ['water_volume', 'waterVolume', 'measurement_date', 'time'];
        
        if (parsedData.columns && parsedData.columns.length > 0) {
          const hasRequiredData = requiredColumns.some(col => 
            parsedData.columns!.some(c => c.toLowerCase().includes(col.toLowerCase()))
          ) || commonColumns.some(col => 
            parsedData.columns!.some(c => c.toLowerCase().includes(col.toLowerCase()))
          );

          if (!hasRequiredData) {
            issues.push({
              severity: 'warning',
              message: 'No standard water measurement columns detected',
              suggestion: 'Include columns for water volume, date/timestamp',
              field: 'columns'
            });
            score -= 0.2;
          }
        }
      }

      // Validate data quality for numerical fields
      if (parsedData.data && Array.isArray(parsedData.data) && parsedData.data.length > 0) {
        const firstRow = parsedData.data[0];
        
        if (typeof firstRow === 'object' && firstRow !== null) {
          // Check for numerical data
          const numericFields = Object.entries(firstRow).filter(([key, value]) => 
            typeof value === 'number' || !isNaN(parseFloat(String(value)))
          );

          if (numericFields.length === 0) {
            issues.push({
              severity: 'warning',
              message: 'No numerical measurement data detected',
              suggestion: 'Ensure file contains numerical measurement values'
            });
            score -= 0.3;
          }

          // Check for missing values
          const missingValues = Object.entries(firstRow).filter(([key, value]) => 
            value === null || value === undefined || value === ''
          );

          if (missingValues.length > 0) {
            issues.push({
              severity: 'info',
              message: `${missingValues.length} empty fields detected in data`,
              suggestion: 'Consider filling missing values where possible'
            });
            score -= 0.05;
          }
        }
      }

      // Validate VWBA-specific requirements
      if (evidence.evidenceType === 'WATER_MEASUREMENT_DATA') {
        const metadata = evidence.metadata as any;
        const vwbaFields = metadata?.parsedData?.vwbaFields || {};
        
        const criticalFields = ['waterVolume', 'water_volume', 'volume'];
        const hasCriticalData = criticalFields.some(field => field in vwbaFields);
        
        if (!hasCriticalData) {
          issues.push({
            severity: 'error',
            message: 'No water volume data found for VWBA calculation',
            suggestion: 'Include water volume measurements in the data file',
            field: 'waterVolume'
          });
          score = Math.min(score, 0.3);
        }
      }

      return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        score: Math.max(0, score),
        issues,
        metadata: {
          ruleName: 'parsed_data_validation',
          ruleDescription: 'Validate parsed file content structure and data quality',
          parsedFormat: parsedData.format,
          rowCount: parsedData.rowCount,
          columnCount: parsedData.columns?.length || 0,
          dataQualityScore: score
        }
      };

    } catch (error) {
      return {
        valid: false,
        score: 0,
        issues: [{
          severity: 'error',
          message: `Parsed data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        metadata: {
          ruleName: 'parsed_data_validation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Calculate quality grade based on score and issues
   */
  private calculateQualityGrade(
    score: number, 
    issues: ValidationIssue[]
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    // Automatic F for any errors
    if (errorCount > 0) {
      return 'F';
    }

    // Grade based on score and warnings
    if (score >= 0.95 && warningCount === 0) {
      return 'A';
    } else if (score >= 0.85 && warningCount <= 2) {
      return 'B';
    } else if (score >= 0.70 && warningCount <= 5) {
      return 'C';
    } else if (score >= 0.60) {
      return 'D';
    } else {
      return 'F';
    }
  }

  /**
   * Get validation rules for evidence type
   */
  getValidationRules(evidenceType: string): EvidenceValidationRule[] {
    return [
      ...(this.validationRules.get('*') || []),
      ...(this.validationRules.get(evidenceType) || [])
    ];
  }

  /**
   * Get available evidence types
   */
  getAvailableEvidenceTypes(): string[] {
    return Array.from(this.validationRules.keys()).filter(type => type !== '*');
  }
}