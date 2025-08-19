import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const verificationRequestRate = new Rate('verification_requests');
export const verificationDuration = new Trend('verification_duration');
export const evidenceUploadDuration = new Trend('evidence_upload_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 5 },   // Ramp up to 5 users
    { duration: '5m', target: 10 },  // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 20 },  // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    verification_requests: ['rate>0.1'], // Verification request rate should be > 0.1/s
  },
};

// Test data
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Sample evidence data (base64 encoded)
const sampleEvidenceData = {
  WATER_MEASUREMENT_DATA: 'data:text/csv;base64,' + encoding.b64encode(`
date,volume_liters,measurement_type,location
2024-01-01,50000,flow_meter,intake_point_1
2024-01-02,48000,flow_meter,intake_point_1
2024-01-03,52000,flow_meter,intake_point_1
`),
  BASELINE_ASSESSMENT: 'data:application/json;base64,' + encoding.b64encode(JSON.stringify({
    baselineVolume: 45000,
    measurementPeriod: '2023-01-01 to 2023-12-31',
    methodology: 'historical_average',
    uncertaintyFactor: 0.15
  })),
  SITE_VERIFICATION: 'data:application/json;base64,' + encoding.b64encode(JSON.stringify({
    projectArea: 100,
    waterSource: 'river',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    verificationDate: '2024-01-15'
  })),
  GPS_COORDINATES: 'data:application/json;base64,' + encoding.b64encode(JSON.stringify({
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 3,
    timestamp: '2024-01-15T10:00:00Z'
  })),
  METHODOLOGY_DOCUMENTATION: 'data:text/plain;base64=' + encoding.b64encode(`
VWBA Methodology Documentation
Project: Test Water Conservation Project
Calculation Method: Direct Measurement
Uncertainty Analysis: ±15%
Quality Assurance: Monthly calibration
`)
};

export function setup() {
  // Create test lift token for verification
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  const liftTokenPayload = JSON.stringify({
    tokenId: `load-test-${Date.now()}`,
    maxSupply: '1000000',
    projectId: 1,
    unit: 'LU'
  });

  const liftTokenResponse = http.post(`${API_BASE_URL}/api/lift-tokens`, liftTokenPayload, { headers });
  
  check(liftTokenResponse, {
    'lift token created': (r) => r.status === 201,
  });

  const liftToken = JSON.parse(liftTokenResponse.body);
  
  // Create test verification method
  const methodPayload = JSON.stringify({
    methodId: `vwba-load-test-${Date.now()}`,
    name: 'VWBA Load Test Method',
    methodologyType: 'VWBA',
    criteria: {
      requiredEvidenceTypes: Object.keys(sampleEvidenceData),
      minimumConfidence: 0.8
    }
  });

  const methodResponse = http.post(`${API_BASE_URL}/api/verification-methods`, methodPayload, { headers });
  
  check(methodResponse, {
    'verification method created': (r) => r.status === 201,
  });

  const method = JSON.parse(methodResponse.body);

  return {
    liftTokenId: liftToken.id,
    methodId: method.methodId,
    headers: headers
  };
}

export default function(data) {
  const { liftTokenId, methodId, headers } = data;

  // Test 1: Submit verification request with evidence
  const startTime = new Date();
  
  const evidence = Object.entries(sampleEvidenceData).map(([type, content]) => ({
    evidenceType: type,
    fileName: `${type.toLowerCase()}.${type === 'WATER_MEASUREMENT_DATA' ? 'csv' : 'json'}`,
    fileContent: content.split(',')[1], // Remove data URL prefix
    mimeType: type === 'WATER_MEASUREMENT_DATA' ? 'text/csv' : 'application/json',
    captureDate: new Date().toISOString(),
    captureLocation: {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1
    },
    metadata: {
      source: 'load_test',
      iteration: __ITER
    }
  }));

  const verificationPayload = JSON.stringify({
    methodId: methodId,
    validatorAddress: '0x' + '1'.repeat(40), // Mock validator address
    validatorName: `Load Test Validator ${__VU}`,
    notes: `Load test verification iteration ${__ITER}`,
    evidence: evidence
  });

  const verificationResponse = http.post(
    `${API_BASE_URL}/api/lift-tokens/${liftTokenId}/verify`,
    verificationPayload,
    { headers }
  );

  const verificationSuccess = check(verificationResponse, {
    'verification submitted': (r) => r.status === 201,
    'verification response valid': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id && body.status;
      } catch {
        return false;
      }
    }
  });

  verificationRequestRate.add(verificationSuccess);
  
  if (verificationSuccess) {
    const verification = JSON.parse(verificationResponse.body);
    
    // Test 2: Check verification status
    const statusResponse = http.get(
      `${API_BASE_URL}/api/lift-tokens/${liftTokenId}/verification-status`,
      { headers }
    );

    check(statusResponse, {
      'status check successful': (r) => r.status === 200,
      'status response valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.hasOwnProperty('verified') && Array.isArray(body.results);
        } catch {
          return false;
        }
      }
    });

    // Test 3: Process verification (if supported)
    if (verification.id) {
      const processResponse = http.post(
        `${API_BASE_URL}/api/verification-results/${verification.id}/calculate`,
        JSON.stringify({}),
        { headers }
      );

      check(processResponse, {
        'verification processing initiated': (r) => r.status === 200 || r.status === 202,
      });
    }

    const endTime = new Date();
    verificationDuration.add(endTime - startTime);
  }

  // Test 4: List verification methods
  const methodsResponse = http.get(`${API_BASE_URL}/api/verification-methods`, { headers });
  
  check(methodsResponse, {
    'methods list retrieved': (r) => r.status === 200,
    'methods response valid': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.methods && Array.isArray(body.methods));
      } catch {
        return false;
      }
    }
  });

  // Test 5: Health check
  const healthResponse = http.get(`${API_BASE_URL}/health`);
  
  check(healthResponse, {
    'health check passed': (r) => r.status === 200,
  });

  sleep(1); // Wait 1 second between iterations
}

export function teardown(data) {
  // Cleanup test data if needed
  console.log('Load test completed');
}