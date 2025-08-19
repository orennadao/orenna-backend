import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestServer } from './utils/test-server.js';
import { VerificationService } from '../src/lib/verification.js';
import { VWBAMethodologyHandler } from '../src/lib/verification/vwba.js';
import { EvidenceValidationPipeline } from '../src/lib/verification/evidence-pipeline.js';
import { createMockUser, createMockLiftToken, createMockVerificationMethod } from './utils/fixtures.js';

describe('Verification System', () => {
  let testServer: TestServer;
  let verificationService: VerificationService;
  let evidencePipeline: EvidenceValidationPipeline;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    
    // Initialize verification services
    verificationService = new VerificationService(
      testServer.prisma,
      testServer.app.log,
      {
        maxFileSize: 50 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf', 'application/json', 'text/csv'],
        confidenceThreshold: 0.8
      }
    );

    evidencePipeline = new EvidenceValidationPipeline(testServer.prisma, testServer.app.log);
    
    // Register methodology handlers
    verificationService.registerMethodology(new VWBAMethodologyHandler());
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('VerificationService', () => {
    it('should submit verification request successfully', async () => {
      // Setup test data
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });
      const method = await testServer.createTestVerificationMethod({
        methodId: 'vwba-v2',
        name: 'VWBA Test Method',
        methodologyType: 'VWBA'
      });

      // Submit verification request
      const result = await verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: method.methodId,
        validatorAddress: user.address,
        validatorName: 'Test Validator',
        notes: 'Test verification request'
      });

      expect(result).toBeDefined();
      expect(result.liftTokenId).toBe(liftToken.id);
      expect(result.methodId).toBe(method.methodId);
      expect(result.status).toBe('PENDING');
      expect(result.validatorAddress).toBe(user.address);
    });

    it('should reject verification for non-existent lift token', async () => {
      const user = await testServer.createTestUser();
      const method = await testServer.createTestVerificationMethod({
        methodId: 'test-method',
        methodologyType: 'TEST'
      });

      await expect(verificationService.submitVerification({
        liftTokenId: 99999,
        methodId: method.methodId,
        validatorAddress: user.address
      })).rejects.toThrow('Lift token 99999 not found');
    });

    it('should reject verification for inactive method', async () => {
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });

      await expect(verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: 'non-existent-method',
        validatorAddress: user.address
      })).rejects.toThrow('Verification method non-existent-method not found or inactive');
    });

    it('should prevent duplicate verification requests', async () => {
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });
      const method = await testServer.createTestVerificationMethod({
        methodId: 'test-method',
        methodologyType: 'TEST'
      });

      // Submit first verification
      await verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: method.methodId,
        validatorAddress: user.address
      });

      // Attempt duplicate submission
      await expect(verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: method.methodId,
        validatorAddress: user.address
      })).rejects.toThrow('Verification already exists for this lift token and method');
    });

    it('should get verification status correctly', async () => {
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });
      const method = await testServer.createTestVerificationMethod({
        methodId: 'test-method',
        methodologyType: 'TEST'
      });

      // Submit verification
      const verification = await verificationService.submitVerification({
        liftTokenId: liftToken.id,
        methodId: method.methodId,
        validatorAddress: user.address
      });

      // Get status
      const status = await verificationService.getVerificationStatus(liftToken.id);

      expect(status.verified).toBe(false);
      expect(status.results).toHaveLength(1);
      expect(status.pending).toHaveLength(1);
      expect(status.pending[0].id).toBe(verification.id);
    });

    it('should register verification method successfully', async () => {
      const methodData = {
        methodId: 'custom-method-v1',
        name: 'Custom Verification Method',
        methodologyType: 'CUSTOM',
        criteria: {
          requiredDataPoints: ['water_volume', 'location'],
          minimumAccuracy: 0.95
        },
        minimumConfidence: 0.85
      };

      const method = await verificationService.registerVerificationMethod(methodData);

      expect(method).toBeDefined();
      expect(method.methodId).toBe(methodData.methodId);
      expect(method.name).toBe(methodData.name);
      expect(method.active).toBe(true);
    });
  });

  describe('VWBA Methodology', () => {
    it('should validate VWBA evidence requirements', async () => {
      const handler = new VWBAMethodologyHandler();
      
      expect(handler.methodId).toBe('vwba-v2');
      expect(handler.getMinimumConfidence()).toBe(0.8);
      
      const requiredTypes = handler.getRequiredEvidenceTypes();
      expect(requiredTypes).toContain('WATER_MEASUREMENT_DATA');
      expect(requiredTypes).toContain('BASELINE_ASSESSMENT');
      expect(requiredTypes).toContain('GPS_COORDINATES');
    });

    it('should reject verification with missing evidence', async () => {
      const handler = new VWBAMethodologyHandler();
      const request = {
        liftTokenId: 1,
        methodId: 'vwba-v2',
        validatorAddress: '0x1234567890123456789012345678901234567890'
      };

      // Empty evidence array
      const result = await handler.validate(request, []);

      expect(result.verified).toBe(false);
      expect(result.confidenceScore).toBe(0);
      expect(result.notes).toContain('Missing required evidence');
    });

    it('should perform VWBA calculation with valid data', async () => {
      const handler = new VWBAMethodologyHandler();
      const request = {
        liftTokenId: 1,
        methodId: 'vwba-v2',
        validatorAddress: '0x1234567890123456789012345678901234567890'
      };

      // Mock evidence files with required data
      const evidence = [
        {
          id: 1,
          evidenceType: 'WATER_MEASUREMENT_DATA',
          fileName: 'water_data.json',
          fileHash: 'hash1',
          metadata: {
            projectWaterVolume: 150000,
            measurementPeriod: 365
          }
        },
        {
          id: 2,
          evidenceType: 'BASELINE_ASSESSMENT',
          fileName: 'baseline.json',
          fileHash: 'hash2',
          metadata: {
            baselineWaterVolume: 100000
          }
        },
        {
          id: 3,
          evidenceType: 'SITE_VERIFICATION',
          fileName: 'site.json',
          fileHash: 'hash3',
          metadata: {
            projectArea: 10,
            waterSource: 'groundwater'
          }
        },
        {
          id: 4,
          evidenceType: 'GPS_COORDINATES',
          fileName: 'location.json',
          fileHash: 'hash4',
          captureLocation: {
            latitude: 40.7128,
            longitude: -74.0060
          },
          metadata: {
            gpsAccuracy: 5
          }
        },
        {
          id: 5,
          evidenceType: 'METHODOLOGY_DOCUMENTATION',
          fileName: 'methodology.pdf',
          fileHash: 'hash5',
          metadata: {
            calculationMethod: 'direct_measurement',
            uncertaintyFactor: 0.1
          }
        }
      ] as any[];

      const result = await handler.validate(request, evidence);

      expect(result.verified).toBe(true);
      expect(result.confidenceScore).toBeGreaterThan(0.8);
      expect(result.calculationData).toBeDefined();
      expect(result.calculationData.waterBenefitVolume).toBe(50000); // 150000 - 100000
    });
  });

  describe('Evidence Validation Pipeline', () => {
    it('should process evidence files successfully', async () => {
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });
      const method = await testServer.createTestVerificationMethod({
        methodId: 'test-method',
        methodologyType: 'TEST'
      });

      // Create verification result
      const verification = await testServer.prisma.verificationResult.create({
        data: {
          liftTokenId: liftToken.id,
          methodId: method.methodId,
          verified: false,
          validatorAddress: user.address,
          verificationDate: new Date()
        }
      });

      // Create evidence file
      await testServer.prisma.evidenceFile.create({
        data: {
          verificationResultId: verification.id,
          evidenceType: 'WATER_MEASUREMENT_DATA',
          fileName: 'test_data.json',
          fileHash: 'test_hash_123',
          fileSize: BigInt(1024),
          mimeType: 'application/json',
          uploadedBy: user.address,
          metadata: {
            waterVolume: 1000,
            measurementPeriod: 30
          }
        }
      });

      // Process evidence
      const result = await evidencePipeline.processEvidence(verification.id);

      expect(result.processed).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.qualityGrade).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.qualityGrade);
    });

    it('should detect file integrity issues', async () => {
      const user = await testServer.createTestUser();
      const project = await testServer.createTestProject();
      const liftToken = await testServer.createTestLiftToken({ projectId: project.id });
      const method = await testServer.createTestVerificationMethod({
        methodId: 'test-method',
        methodologyType: 'TEST'
      });

      // Create verification result
      const verification = await testServer.prisma.verificationResult.create({
        data: {
          liftTokenId: liftToken.id,
          methodId: method.methodId,
          verified: false,
          validatorAddress: user.address,
          verificationDate: new Date()
        }
      });

      // Create evidence file with mismatched hash
      await testServer.prisma.evidenceFile.create({
        data: {
          verificationResultId: verification.id,
          evidenceType: 'TEST_DATA',
          fileName: 'corrupted_file.json',
          fileHash: 'wrong_hash',
          fileSize: BigInt(100),
          mimeType: 'application/json',
          uploadedBy: user.address
        }
      });

      // Process with actual file content
      const fileContent = new Map();
      fileContent.set(1, Buffer.from('{"test": "data"}'));

      const result = await evidencePipeline.processEvidence(verification.id, fileContent);

      expect(result.processed).toBe(true);
      expect(result.qualityGrade).toBe('F'); // Should fail due to hash mismatch
      expect(result.issues.some(issue => 
        issue.severity === 'error' && issue.message.includes('hash mismatch')
      )).toBe(true);
    });
  });
});