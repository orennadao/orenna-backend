-- Verification performance indexes for production optimization
-- These indexes are designed to optimize the most common verification queries

-- 1. Verification Results Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_lift_token_method 
ON "VerificationResult" ("liftTokenId", "methodId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_status_created 
ON "VerificationResult" ("status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_validator_date 
ON "VerificationResult" ("validatorAddress", "verificationDate" DESC);

-- 2. Evidence Files Performance Indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_verification_result 
ON "EvidenceFile" ("verificationResultId", "evidenceType");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_hash_processed 
ON "EvidenceFile" ("fileHash", "processed", "verified");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_ipfs_cid 
ON "EvidenceFile" ("ipfsCid") WHERE "ipfsCid" IS NOT NULL;

-- 3. Verification Methods Lookup Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_methods_type_active 
ON "VerificationMethod" ("methodologyType", "active");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_methods_chain_active 
ON "VerificationMethod" ("chainId", "active") WHERE "chainId" IS NOT NULL;

-- 4. Lift Token Events for Verification Tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lift_token_events_verification 
ON "LiftTokenEvent" ("liftTokenId", "type", "eventAt" DESC) 
WHERE "type" IN ('VERIFICATION_SUBMITTED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'EVIDENCE_UPLOADED');

-- 5. Composite indexes for complex verification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_comprehensive 
ON "VerificationResult" ("liftTokenId", "status", "verified", "createdAt" DESC);

-- 6. Partial indexes for active/pending verifications (most common queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_pending 
ON "VerificationResult" ("liftTokenId", "methodId", "createdAt" DESC) 
WHERE "status" IN ('PENDING', 'IN_REVIEW');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_verified 
ON "VerificationResult" ("liftTokenId", "verificationDate" DESC) 
WHERE "verified" = true AND "status" = 'VERIFIED';

-- 7. Evidence processing queue optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_processing_queue 
ON "EvidenceFile" ("createdAt") 
WHERE "processed" = false;

-- 8. Verification method performance lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_methods_lookup 
ON "VerificationMethod" ("methodId", "active", "methodologyType");

-- 9. Analytics and reporting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_analytics 
ON "VerificationResult" ("methodId", "status", "verificationDate", "confidenceScore");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_analytics 
ON "EvidenceFile" ("evidenceType", "processed", "qualityGrade", "createdAt");

-- 10. GIN indexes for JSONB columns (metadata searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_calculation_data 
ON "VerificationResult" USING GIN ("calculationData");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_files_metadata 
ON "EvidenceFile" USING GIN ("metadata");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_methods_criteria 
ON "VerificationMethod" USING GIN ("criteria");

-- 11. Full-text search indexes for verification notes and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_notes_fulltext 
ON "VerificationResult" USING GIN (to_tsvector('english', "notes")) 
WHERE "notes" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_methods_description_fulltext 
ON "VerificationMethod" USING GIN (to_tsvector('english', "description")) 
WHERE "description" IS NOT NULL;

-- Performance statistics
-- Add table statistics collection for query planner optimization
ALTER TABLE "VerificationResult" SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE "EvidenceFile" SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE "VerificationMethod" SET (autovacuum_analyze_scale_factor = 0.1);

-- Update table statistics immediately
ANALYZE "VerificationResult";
ANALYZE "EvidenceFile";
ANALYZE "VerificationMethod";
ANALYZE "LiftTokenEvent";