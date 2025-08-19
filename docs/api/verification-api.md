# Orenna Verification System API Documentation

## Overview

The Orenna Verification System provides a comprehensive API for managing and verifying lift tokens using standardized methodologies like VWBA v2.0. This documentation covers all verification-related endpoints and their usage.

## Base URL

- **Production**: `https://api.orenna.com`
- **Staging**: `https://staging-api.orenna.com`
- **Development**: `http://localhost:3001`

## Authentication

All API endpoints require authentication using Bearer tokens:

```http
Authorization: Bearer <your-api-token>
```

## Rate Limits

- **General API**: 100 requests per minute
- **Verification endpoints**: 5 requests per 5 minutes
- **Evidence upload**: 10 files per hour

## Core Verification Endpoints

### 1. Submit Verification Request

Submit a verification request for a lift token with evidence files.

**Endpoint**: `POST /api/lift-tokens/{id}/verify`

**Parameters**:
- `id` (path): Lift token ID

**Request Body**:
```json
{
  "methodId": "vwba-v2.0",
  "validatorAddress": "0x1234567890123456789012345678901234567890",
  "validatorName": "Water Conservation Validator Inc.",
  "notes": "Initial verification for Q1 2024 water conservation project",
  "evidence": [
    {
      "evidenceType": "WATER_MEASUREMENT_DATA",
      "fileName": "water_measurements_q1_2024.csv",
      "fileContent": "base64-encoded-file-content",
      "mimeType": "text/csv",
      "captureDate": "2024-03-31T23:59:59Z",
      "captureLocation": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "altitude": 10
      },
      "captureDevice": "Flow Meter Model XYZ-123",
      "metadata": {
        "calibrationDate": "2024-01-01",
        "accuracy": "±2%",
        "measurementFrequency": "hourly"
      }
    },
    {
      "evidenceType": "BASELINE_ASSESSMENT",
      "fileName": "baseline_assessment.json",
      "fileContent": "base64-encoded-file-content",
      "mimeType": "application/json",
      "metadata": {
        "assessmentPeriod": "2023-01-01 to 2023-12-31",
        "methodology": "historical_average"
      }
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": 12345,
  "liftTokenId": 67890,
  "methodId": "vwba-v2.0",
  "status": "PENDING",
  "verificationDate": "2024-08-17T12:30:00Z",
  "evidenceCount": 2
}
```

### 2. Get Verification Status

Retrieve the verification status for a lift token.

**Endpoint**: `GET /api/lift-tokens/{id}/verification-status`

**Response** (200 OK):
```json
{
  "verified": false,
  "results": [
    {
      "id": 12345,
      "methodId": "vwba-v2.0",
      "verified": false,
      "confidenceScore": null,
      "status": "PENDING",
      "verificationDate": "2024-08-17T12:30:00Z",
      "validatorAddress": "0x1234567890123456789012345678901234567890",
      "evidenceCount": 2,
      "verificationMethod": {
        "name": "VWBA v2.0",
        "methodologyType": "VWBA",
        "minimumConfidence": 0.8
      }
    }
  ],
  "pending": [
    {
      "id": 12345,
      "status": "PENDING",
      "submittedAt": "2024-08-17T12:30:00Z"
    }
  ]
}
```

### 3. Process Verification Calculation

Trigger verification calculation for a submitted verification request.

**Endpoint**: `POST /api/verification-results/{id}/calculate`

**Request Body**:
```json
{
  "priority": "high",
  "forceRecalculation": false
}
```

**Response** (202 Accepted):
```json
{
  "jobId": "calc_67890_12345",
  "status": "queued",
  "estimatedCompletion": "2024-08-17T12:35:00Z",
  "priority": "high"
}
```

### 4. Process Evidence Files

Process and validate evidence files for a verification request.

**Endpoint**: `POST /api/verification-results/{id}/process-evidence`

**Response** (200 OK):
```json
{
  "processed": 5,
  "successful": 4,
  "failed": 1,
  "overallScore": 0.85,
  "qualityGrade": "B+",
  "issues": [
    {
      "evidenceType": "GPS_COORDINATES",
      "severity": "warning",
      "message": "GPS accuracy below recommended threshold"
    }
  ],
  "ipfsHashes": [
    "QmX1Y2Z3...",
    "QmA4B5C6..."
  ]
}
```

### 5. Get MRV Assessment

Retrieve MRV (Monitoring, Reporting, Verification) compliance assessment.

**Endpoint**: `GET /api/verification-results/{id}/mrv-assessment`

**Response** (200 OK):
```json
{
  "compliant": true,
  "protocol": "VWBA",
  "assessmentDate": "2024-08-17T12:30:00Z",
  "compliance": {
    "monitoring": {
      "score": 0.92,
      "status": "compliant",
      "requirements": [
        {
          "requirement": "Continuous water flow monitoring",
          "met": true,
          "evidence": ["WATER_MEASUREMENT_DATA"]
        }
      ]
    },
    "reporting": {
      "score": 0.88,
      "status": "compliant",
      "requirements": [
        {
          "requirement": "Baseline documentation",
          "met": true,
          "evidence": ["BASELINE_ASSESSMENT"]
        }
      ]
    },
    "verification": {
      "score": 0.85,
      "status": "compliant",
      "requirements": [
        {
          "requirement": "Independent validation",
          "met": true,
          "evidence": ["SITE_VERIFICATION"]
        }
      ]
    }
  },
  "overallScore": 0.88,
  "recommendations": [
    "Consider increasing GPS accuracy for future submissions"
  ]
}
```

## Verification Methods Management

### 6. List Verification Methods

Retrieve available verification methods.

**Endpoint**: `GET /api/verification-methods`

**Query Parameters**:
- `methodologyType` (optional): Filter by methodology type
- `active` (optional): Filter by active status
- `chainId` (optional): Filter by blockchain chain ID

**Response** (200 OK):
```json
[
  {
    "methodId": "vwba-v2.0",
    "name": "Volumetric Water Benefit Accounting v2.0",
    "description": "WRI VWBA v2.0 methodology for water stewardship verification",
    "methodologyType": "VWBA",
    "version": "2.0",
    "active": true,
    "criteria": {
      "requiredEvidenceTypes": [
        "WATER_MEASUREMENT_DATA",
        "BASELINE_ASSESSMENT",
        "SITE_VERIFICATION",
        "GPS_COORDINATES",
        "METHODOLOGY_DOCUMENTATION"
      ],
      "minimumConfidence": 0.8,
      "validationPeriod": 365
    },
    "minimumConfidence": 0.8,
    "requiredDataTypes": ["flow_data", "baseline_data", "location_data"],
    "chainId": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 7. Register Verification Method

Register a new verification method.

**Endpoint**: `POST /api/verification-methods`

**Request Body**:
```json
{
  "methodId": "custom-carbon-v1",
  "name": "Custom Carbon Credit Verification",
  "description": "Custom methodology for carbon credit verification",
  "methodologyType": "CARBON",
  "version": "1.0",
  "criteria": {
    "requiredEvidenceTypes": ["CARBON_MEASUREMENT", "PROJECT_DOCUMENTATION"],
    "minimumConfidence": 0.9,
    "validationPeriod": 180
  },
  "requiredDataTypes": ["emission_data", "project_data"],
  "minimumConfidence": 0.9,
  "validationPeriod": 180,
  "chainId": 1,
  "approvedValidators": ["0x1234567890123456789012345678901234567890"],
  "metadata": {
    "standard": "VCS",
    "version": "v4.0"
  }
}
```

**Response** (201 Created):
```json
{
  "methodId": "custom-carbon-v1",
  "name": "Custom Carbon Credit Verification",
  "active": true,
  "createdAt": "2024-08-17T12:30:00Z"
}
```

### 8. Get MRV Protocols

List available MRV protocols and their requirements.

**Endpoint**: `GET /api/mrv-protocols`

**Response** (200 OK):
```json
[
  {
    "protocolId": "vwba-mrv",
    "name": "VWBA MRV Protocol",
    "version": "2.0",
    "applicableMethodologies": ["VWBA"],
    "requirements": {
      "monitoring": [
        "Continuous data collection",
        "Calibrated equipment",
        "Data validation procedures"
      ],
      "reporting": [
        "Standardized data formats",
        "Regular reporting intervals",
        "Transparency documentation"
      ],
      "verification": [
        "Independent third-party validation",
        "Evidence integrity verification",
        "Quality assurance procedures"
      ]
    },
    "minimumCompliance": 0.8
  }
]
```

## Batch Operations

### 9. Batch Verification

Submit multiple verification requests in a single operation.

**Endpoint**: `POST /api/lift-tokens/batch/verify`

**Request Body**:
```json
{
  "verifications": [
    {
      "liftTokenId": 1,
      "methodId": "vwba-v2.0",
      "validatorAddress": "0x1234567890123456789012345678901234567890",
      "evidence": [...]
    },
    {
      "liftTokenId": 2,
      "methodId": "vwba-v2.0",
      "validatorAddress": "0x1234567890123456789012345678901234567890",
      "evidence": [...]
    }
  ],
  "priority": "normal",
  "sharedEvidence": true
}
```

**Response** (202 Accepted):
```json
{
  "batchId": "batch_20240817_001",
  "requestsSubmitted": 2,
  "estimatedCompletion": "2024-08-17T13:00:00Z",
  "status": "processing"
}
```

### 10. Batch Status Check

Check the status of multiple verification requests.

**Endpoint**: `POST /api/lift-tokens/batch/status`

**Request Body**:
```json
{
  "liftTokenIds": [1, 2, 3, 4, 5]
}
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "liftTokenId": 1,
      "verified": true,
      "latestVerification": {
        "status": "VERIFIED",
        "confidenceScore": 0.92,
        "completedAt": "2024-08-17T12:45:00Z"
      }
    },
    {
      "liftTokenId": 2,
      "verified": false,
      "latestVerification": {
        "status": "PENDING",
        "submittedAt": "2024-08-17T12:30:00Z"
      }
    }
  ],
  "summary": {
    "total": 5,
    "verified": 1,
    "pending": 2,
    "rejected": 1,
    "not_submitted": 1
  }
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Validation failed",
  "message": "Evidence file exceeds maximum size limit",
  "code": "EVIDENCE_TOO_LARGE",
  "details": {
    "maxSize": "50MB",
    "receivedSize": "75MB",
    "fileName": "large_dataset.csv"
  },
  "timestamp": "2024-08-17T12:30:00Z",
  "requestId": "req_abc123def456"
}
```

### Common Error Codes

- `INVALID_TOKEN`: Invalid or expired authentication token
- `RATE_LIMIT_EXCEEDED`: Too many requests within the rate limit window
- `LIFT_TOKEN_NOT_FOUND`: Specified lift token does not exist
- `METHOD_NOT_FOUND`: Verification method not found or inactive
- `EVIDENCE_TOO_LARGE`: Evidence file exceeds size limits
- `INVALID_EVIDENCE_TYPE`: Evidence type not supported by methodology
- `DUPLICATE_VERIFICATION`: Verification already exists for this token/method
- `VALIDATION_FAILED`: Request validation failed
- `PROCESSING_ERROR`: Error during verification processing
- `INSUFFICIENT_EVIDENCE`: Not enough evidence for verification

## SDKs and Integration

### JavaScript/Node.js SDK

```bash
npm install @orenna/verification-sdk
```

```javascript
import { OrennaVerificationClient } from '@orenna/verification-sdk';

const client = new OrennaVerificationClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.orenna.com'
});

// Submit verification
const verification = await client.submitVerification({
  liftTokenId: 12345,
  methodId: 'vwba-v2.0',
  validatorAddress: '0x...',
  evidence: [...]
});

// Check status
const status = await client.getVerificationStatus(12345);
```

### Python SDK

```bash
pip install orenna-verification-sdk
```

```python
from orenna_verification import VerificationClient

client = VerificationClient(
    api_key="your-api-key",
    base_url="https://api.orenna.com"
)

# Submit verification
verification = client.submit_verification(
    lift_token_id=12345,
    method_id="vwba-v2.0",
    validator_address="0x...",
    evidence=[...]
)

# Check status
status = client.get_verification_status(12345)
```

## WebSocket Real-time Updates

Connect to real-time verification updates:

```javascript
const ws = new WebSocket('wss://api.orenna.com/ws');

ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'verification',
  liftTokenId: 12345
}));

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Verification update:', update);
};
```

## Changelog

### v2.1.0 (2024-08-17)
- Added batch verification operations
- Enhanced MRV assessment endpoints
- Improved error handling and validation
- Added WebSocket real-time updates

### v2.0.0 (2024-08-01)
- Complete VWBA v2.0 implementation
- Evidence processing pipeline
- IPFS integration for evidence storage
- Multi-validator consensus support

---

For additional support or questions, contact our API team at api-support@orenna.com