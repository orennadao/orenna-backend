// Verification System Types
export interface VerificationRequest {
  methodId: string;
  validatorAddress: string;
  validatorName?: string;
  notes?: string;
  evidence?: EvidenceSubmission[];
}

export interface EvidenceSubmission {
  evidenceType: string;
  fileName: string;
  fileContent: string; // Base64 encoded
  mimeType: string;
  captureDate?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  captureDevice?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  id: number;
  liftTokenId: number;
  methodId: string;
  verified: boolean;
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  confidenceScore?: number;
  evidenceHash?: string;
  calculationData?: Record<string, any>;
  validatorAddress: string;
  validatorName?: string;
  verificationDate: string;
  submittedAt?: string;
  notes?: string;
  evidenceFiles?: EvidenceFile[];
  verificationMethod?: VerificationMethodSummary;
}

export interface VerificationStatus {
  verified: boolean;
  results: VerificationResult[];
  pending: VerificationResult[];
}

export interface VerificationMethod {
  id?: number;
  methodId: string;
  name: string;
  description?: string;
  methodologyType: string;
  version?: string;
  active: boolean;
  criteria: VerificationCriteria;
  minimumConfidence?: number;
  requiredDataTypes?: string[];
  validationPeriod?: number;
  registryContract?: string;
  chainId?: number;
  methodHash?: string;
  approvedValidators?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationMethodSummary {
  name: string;
  methodologyType: string;
  minimumConfidence?: number;
}

export interface VerificationCriteria {
  requiredEvidenceTypes: string[];
  minimumConfidence: number;
  validationPeriod?: number;
}

export interface EvidenceFile {
  id: number;
  evidenceType: string;
  fileName: string;
  originalFileName: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  ipfsCid?: string;
  captureDate?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  captureDevice?: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
  processed: boolean;
  verified: boolean;
  qualityScore?: number;
  qualityGrade?: string;
  createdAt: string;
}

export interface EvidenceProcessingResult {
  processed: number;
  successful: number;
  failed: number;
  overallScore: number;
  qualityGrade: string;
  issues: EvidenceIssue[];
  ipfsHashes: string[];
}

export interface EvidenceIssue {
  evidenceType: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface MRVAssessment {
  compliant: boolean;
  protocol: string;
  assessmentDate: string;
  compliance: {
    monitoring: ComplianceSection;
    reporting: ComplianceSection;
    verification: ComplianceSection;
  };
  overallScore: number;
  recommendations: string[];
}

export interface ComplianceSection {
  score: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  requirements: Requirement[];
}

export interface Requirement {
  requirement: string;
  met: boolean;
  evidence: string[];
}

export interface BatchVerificationRequest {
  verifications: Array<{
    liftTokenId: number;
    methodId: string;
    validatorAddress: string;
    validatorName?: string;
    notes?: string;
    evidence?: EvidenceSubmission[];
  }>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  sharedEvidence?: boolean;
}

export interface BatchStatusRequest {
  liftTokenIds: number[];
}

export interface BatchStatusResponse {
  results: BatchStatusItem[];
  summary: BatchSummary;
}

export interface BatchStatusItem {
  liftTokenId: number;
  verified: boolean;
  latestVerification?: VerificationResult;
}

export interface BatchSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  not_submitted: number;
}

export interface BatchJobResponse {
  batchId: string;
  requestsSubmitted: number;
  estimatedCompletion: string;
  status: 'processing' | 'completed' | 'failed';
}

// VWBA Specific Types
export interface VWBAData {
  projectVolume: number;
  baselineVolume: number;
  measurementPeriod: {
    start: string;
    end: string;
  };
  projectArea?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  waterSource: string;
  methodology: string;
  uncertaintyFactor: number;
}

export interface VWBACalculationResult {
  netWaterBenefit: number;
  benefitPerHectare?: number;
  annualizedBenefit: number;
  uncertaintyRange: {
    lower: number;
    upper: number;
  };
  confidenceScore: number;
  qualityGrade: string;
  calculationDate: string;
}

// Evidence Types for VWBA
export const VWBA_EVIDENCE_TYPES = [
  'WATER_MEASUREMENT_DATA',
  'BASELINE_ASSESSMENT', 
  'SITE_VERIFICATION',
  'GPS_COORDINATES',
  'METHODOLOGY_DOCUMENTATION'
] as const;

export type VWBAEvidenceType = typeof VWBA_EVIDENCE_TYPES[number];

// WebSocket Update Types
export interface VerificationUpdate {
  type: 'status_change' | 'processing_complete' | 'evidence_processed' | 'error';
  liftTokenId: number;
  verificationResultId?: number;
  data: any;
  timestamp: string;
}