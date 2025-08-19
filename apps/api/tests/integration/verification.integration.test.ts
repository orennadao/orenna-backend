import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestServer } from '../utils/test-server.js';
import liftTokenRoutes from '../../src/routes/lift-tokens.js';
import { expectSuccessResponse, expectErrorResponse } from '../utils/test-helpers.js';

describe('Verification API Integration Tests', () => {
  let testServer: TestServer;
  let authToken: string;
  let testUser: any;
  let testLiftToken: any;
  let testMethod: any;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    await testServer.app.register(liftTokenRoutes);
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  beforeEach(async () => {
    await testServer.resetDatabase();
    
    // Create test user and get auth token
    testUser = await testServer.createTestUser();
    authToken = await testServer.getAuthToken(testUser);
    
    // Create test project and lift token
    const project = await testServer.createTestProject();
    testLiftToken = await testServer.createTestLiftToken({ projectId: project.id });
    
    // Create test verification method
    testMethod = await testServer.createTestVerificationMethod({
      methodId: 'vwba-v2',
      name: 'VWBA Test Method',
      methodologyType: 'VWBA',
      criteria: {
        requiredDataPoints: ['water_volume', 'baseline'],
        minimumAccuracy: 0.9
      },
      minimumConfidence: 0.8
    });
  });

  describe('POST /lift-tokens/:id/verify', () => {
    it('should submit verification request successfully', async () => {
      const verificationRequest = {
        methodId: testMethod.methodId,
        validatorAddress: testUser.address,
        validatorName: 'Test Validator',
        notes: 'Integration test verification',
        evidence: [
          {
            evidenceType: 'WATER_MEASUREMENT_DATA',
            fileName: 'water_data.json',
            fileContent: Buffer.from(JSON.stringify({
              waterVolume: 150000,
              measurementPeriod: 365
            })).toString('base64'),
            mimeType: 'application/json',
            captureDate: new Date().toISOString(),
            metadata: {
              projectWaterVolume: 150000,
              measurementPeriod: 365
            }
          }
        ]
      };

      const response = await testServer.app.inject({
        method: 'POST',
        url: `/lift-tokens/${testLiftToken.id}/verify`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: verificationRequest
      });

      expectSuccessResponse(response, 201);
      const body = response.json();
      
      expect(body.id).toBeDefined();
      expect(body.liftTokenId).toBe(testLiftToken.id);
      expect(body.methodId).toBe(testMethod.methodId);
      expect(body.status).toBe('PENDING');
      expect(body.evidenceCount).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await testServer.app.inject({
        method: 'POST',
        url: `/lift-tokens/${testLiftToken.id}/verify`,
        payload: {
          methodId: testMethod.methodId,
          validatorAddress: testUser.address
        }
      });

      expectErrorResponse(response, 401);
    });

    it('should validate request payload', async () => {
      const response = await testServer.app.inject({
        method: 'POST',
        url: `/lift-tokens/${testLiftToken.id}/verify`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          methodId: '', // Invalid: empty string
          validatorAddress: 'invalid-address' // Invalid: not ETH address
        }
      });

      expectErrorResponse(response, 400);
    });

    it('should reject verification for non-existent lift unit', async () => {
      const response = await testServer.app.inject({
        method: 'POST',
        url: '/lift-tokens/99999/verify',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          methodId: testMethod.methodId,
          validatorAddress: testUser.address
        }
      });

      expectErrorResponse(response, 500);
    });
  });

  describe('GET /lift-tokens/:id/verification-status', () => {
    it('should return verification status', async () => {
      // Submit verification first
      await testServer.app.inject({
        method: 'POST',
        url: `/lift-tokens/${testLiftToken.id}/verify`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          methodId: testMethod.methodId,
          validatorAddress: testUser.address
        }
      });

      const response = await testServer.app.inject({
        method: 'GET',
        url: `/lift-tokens/${testLiftToken.id}/verification-status`
      });

      expectSuccessResponse(response, 200);
      const body = response.json();
      
      expect(body.verified).toBe(false);
      expect(body.results).toHaveLength(1);
      expect(body.pending).toHaveLength(1);
      expect(body.results[0].methodId).toBe(testMethod.methodId);
    });

    it('should return empty status for unverified lift unit', async () => {
      const response = await testServer.app.inject({
        method: 'GET',
        url: `/lift-tokens/${testLiftToken.id}/verification-status`
      });

      expectSuccessResponse(response, 200);
      const body = response.json();
      
      expect(body.verified).toBe(false);
      expect(body.results).toHaveLength(0);
      expect(body.pending).toHaveLength(0);
    });
  });

  describe('GET /verification-methods', () => {
    it('should return available verification methods', async () => {
      const response = await testServer.app.inject({
        method: 'GET',
        url: '/verification-methods'
      });

      expectSuccessResponse(response, 200);
      const body = response.json();
      
      expect(body.methods).toBeDefined();
      expect(Array.isArray(body.methods)).toBe(true);
      expect(body.methods.length).toBeGreaterThan(0);
      
      const method = body.methods.find((m: any) => m.methodId === testMethod.methodId);
      expect(method).toBeDefined();
      expect(method.name).toBe(testMethod.name);
      expect(method.methodologyType).toBe(testMethod.methodologyType);
    });

    it('should filter methods by methodology type', async () => {
      const response = await testServer.app.inject({
        method: 'GET',
        url: '/verification-methods?methodologyType=VWBA'
      });

      expectSuccessResponse(response, 200);
      const body = response.json();
      
      expect(body.methods).toBeDefined();
      expect(body.methods.every((m: any) => m.methodologyType === 'VWBA')).toBe(true);
    });
  });

  describe('POST /verification-methods', () => {
    it('should register new verification method', async () => {
      const methodData = {
        methodId: 'custom-test-method',
        name: 'Custom Test Method',
        methodologyType: 'CUSTOM',
        criteria: {
          requiredFields: ['measurement', 'location'],
          accuracy: 0.95
        },
        minimumConfidence: 0.85,
        requiredDataTypes: ['SENSOR_DATA', 'GPS_COORDINATES']
      };

      const response = await testServer.app.inject({
        method: 'POST',
        url: '/verification-methods',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: methodData
      });

      expectSuccessResponse(response, 201);
      const body = response.json();
      
      expect(body.id).toBeDefined();
      expect(body.methodId).toBe(methodData.methodId);
      expect(body.name).toBe(methodData.name);
      expect(body.active).toBe(true);
    });

    it('should require authentication for method registration', async () => {
      const response = await testServer.app.inject({
        method: 'POST',
        url: '/verification-methods',
        payload: {
          methodId: 'test',
          name: 'Test',
          methodologyType: 'TEST',
          criteria: {}
        }
      });

      expectErrorResponse(response, 401);
    });

    it('should validate method registration payload', async () => {
      const response = await testServer.app.inject({
        method: 'POST',
        url: '/verification-methods',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing required fields
          methodId: '',
          name: ''
        }
      });

      expectErrorResponse(response, 400);
    });
  });

  describe('GET /mrv-protocols', () => {
    it('should return available MRV protocols', async () => {
      const response = await testServer.app.inject({
        method: 'GET',
        url: '/mrv-protocols'
      });

      expectSuccessResponse(response, 200);
      const body = response.json();
      
      expect(body.protocols).toBeDefined();
      expect(Array.isArray(body.protocols)).toBe(true);
      expect(body.protocols.length).toBeGreaterThan(0);
      
      const waterProtocol = body.protocols.find((p: any) => 
        p.name === 'Water Conservation MRV'
      );
      expect(waterProtocol).toBeDefined();
      expect(waterProtocol.version).toBeDefined();
      expect(waterProtocol.measurementRequirements).toBeDefined();
      expect(waterProtocol.reportingRequirements).toBeDefined();
      expect(waterProtocol.verificationRequirements).toBeDefined();
    });
  });

  describe('Verification Workflow', () => {
    it('should complete full verification workflow', async () => {
      // Step 1: Submit verification request
      const verificationRequest = {
        methodId: testMethod.methodId,
        validatorAddress: testUser.address,
        validatorName: 'Integration Test Validator',
        evidence: [
          {
            evidenceType: 'WATER_MEASUREMENT_DATA',
            fileName: 'water_measurements.json',
            fileContent: Buffer.from(JSON.stringify({
              projectWaterVolume: 150000,
              measurementPeriod: 365,
              accuracy: 0.95
            })).toString('base64'),
            mimeType: 'application/json',
            metadata: {
              projectWaterVolume: 150000,
              measurementPeriod: 365
            }
          },
          {
            evidenceType: 'BASELINE_ASSESSMENT',
            fileName: 'baseline.json',
            fileContent: Buffer.from(JSON.stringify({
              baselineWaterVolume: 100000
            })).toString('base64'),
            mimeType: 'application/json',
            metadata: {
              baselineWaterVolume: 100000
            }
          },
          {
            evidenceType: 'SITE_VERIFICATION',
            fileName: 'site_info.json',
            fileContent: Buffer.from(JSON.stringify({
              projectArea: 10,
              waterSource: 'groundwater'
            })).toString('base64'),
            mimeType: 'application/json',
            metadata: {
              projectArea: 10,
              waterSource: 'groundwater'
            }
          },
          {
            evidenceType: 'GPS_COORDINATES',
            fileName: 'location.json',
            fileContent: Buffer.from(JSON.stringify({
              latitude: 40.7128,
              longitude: -74.0060
            })).toString('base64'),
            mimeType: 'application/json',
            captureLocation: {
              latitude: 40.7128,
              longitude: -74.0060
            },
            metadata: {
              gpsAccuracy: 5
            }
          },
          {
            evidenceType: 'METHODOLOGY_DOCUMENTATION',
            fileName: 'methodology.json',
            fileContent: Buffer.from(JSON.stringify({
              calculationMethod: 'direct_measurement',
              uncertaintyFactor: 0.1
            })).toString('base64'),
            mimeType: 'application/json',
            metadata: {
              calculationMethod: 'direct_measurement',
              uncertaintyFactor: 0.1
            }
          }
        ]
      };

      const submitResponse = await testServer.app.inject({
        method: 'POST',
        url: `/lift-tokens/${testLiftToken.id}/verify`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: verificationRequest
      });

      expectSuccessResponse(submitResponse, 201);
      const submitBody = submitResponse.json();
      const verificationResultId = submitBody.id;

      // Step 2: Process evidence
      const processResponse = await testServer.app.inject({
        method: 'POST',
        url: `/verification-results/${verificationResultId}/process-evidence`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      expectSuccessResponse(processResponse, 200);
      const processBody = processResponse.json();
      expect(processBody.processed).toBe(true);
      expect(processBody.overallScore).toBeGreaterThan(0);

      // Step 3: Perform verification calculation
      const calculateResponse = await testServer.app.inject({
        method: 'POST',
        url: `/verification-results/${verificationResultId}/calculate`,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      expectSuccessResponse(calculateResponse, 200);
      const calculateBody = calculateResponse.json();
      expect(calculateBody.verified).toBe(true);
      expect(calculateBody.confidenceScore).toBeGreaterThan(0.8);
      expect(calculateBody.calculationData).toBeDefined();

      // Step 4: Check final verification status
      const statusResponse = await testServer.app.inject({
        method: 'GET',
        url: `/lift-tokens/${testLiftToken.id}/verification-status`
      });

      expectSuccessResponse(statusResponse, 200);
      const statusBody = statusResponse.json();
      expect(statusBody.verified).toBe(true);
      expect(statusBody.results).toHaveLength(1);
      expect(statusBody.results[0].verified).toBe(true);
      expect(statusBody.pending).toHaveLength(0);
    });
  });
});