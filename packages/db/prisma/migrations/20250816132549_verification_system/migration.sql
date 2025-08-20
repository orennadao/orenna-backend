-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "LiftToken" ADD COLUMN     "verificationMethodId" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VerificationMethod" (
    "id" SERIAL NOT NULL,
    "methodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "methodologyType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "criteria" JSONB NOT NULL,
    "requiredDataTypes" JSONB,
    "minimumConfidence" DECIMAL(5,4),
    "validationPeriod" INTEGER,
    "registryContract" TEXT,
    "chainId" INTEGER,
    "methodHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "approvedValidators" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationResult" (
    "id" SERIAL NOT NULL,
    "liftTokenId" INTEGER NOT NULL,
    "methodId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "confidenceScore" DECIMAL(5,4),
    "verificationLevel" TEXT,
    "evidenceHash" TEXT,
    "evidenceIpfsCid" TEXT,
    "calculationData" JSONB,
    "validatorAddress" TEXT NOT NULL,
    "validatorName" TEXT,
    "verificationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "metadata" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" SERIAL NOT NULL,
    "verificationResultId" INTEGER NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT,
    "fileHash" TEXT NOT NULL,
    "ipfsCid" TEXT,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT,
    "captureDate" TIMESTAMP(3),
    "captureLocation" JSONB,
    "captureDevice" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationMethod_methodId_key" ON "VerificationMethod"("methodId");

-- CreateIndex
CREATE INDEX "VerificationMethod_methodId_idx" ON "VerificationMethod"("methodId");

-- CreateIndex
CREATE INDEX "VerificationMethod_methodologyType_idx" ON "VerificationMethod"("methodologyType");

-- CreateIndex
CREATE INDEX "VerificationMethod_active_idx" ON "VerificationMethod"("active");

-- CreateIndex
CREATE INDEX "VerificationMethod_chainId_idx" ON "VerificationMethod"("chainId");

-- CreateIndex
CREATE INDEX "VerificationResult_liftTokenId_idx" ON "VerificationResult"("liftTokenId");

-- CreateIndex
CREATE INDEX "VerificationResult_methodId_idx" ON "VerificationResult"("methodId");

-- CreateIndex
CREATE INDEX "VerificationResult_verified_idx" ON "VerificationResult"("verified");

-- CreateIndex
CREATE INDEX "VerificationResult_status_idx" ON "VerificationResult"("status");

-- CreateIndex
CREATE INDEX "VerificationResult_verificationDate_idx" ON "VerificationResult"("verificationDate");

-- CreateIndex
CREATE INDEX "VerificationResult_validatorAddress_idx" ON "VerificationResult"("validatorAddress");

-- CreateIndex
CREATE INDEX "EvidenceFile_verificationResultId_idx" ON "EvidenceFile"("verificationResultId");

-- CreateIndex
CREATE INDEX "EvidenceFile_evidenceType_idx" ON "EvidenceFile"("evidenceType");

-- CreateIndex
CREATE INDEX "EvidenceFile_fileHash_idx" ON "EvidenceFile"("fileHash");

-- CreateIndex
CREATE INDEX "EvidenceFile_ipfsCid_idx" ON "EvidenceFile"("ipfsCid");

-- CreateIndex
CREATE INDEX "EvidenceFile_uploadedBy_idx" ON "EvidenceFile"("uploadedBy");

-- CreateIndex
CREATE INDEX "EvidenceFile_processed_idx" ON "EvidenceFile"("processed");

-- CreateIndex
CREATE INDEX "LiftToken_verificationMethodId_idx" ON "LiftToken"("verificationMethodId");

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_verificationMethodId_fkey" FOREIGN KEY ("verificationMethodId") REFERENCES "VerificationMethod"("methodId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_liftTokenId_fkey" FOREIGN KEY ("liftTokenId") REFERENCES "LiftToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "VerificationMethod"("methodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_verificationResultId_fkey" FOREIGN KEY ("verificationResultId") REFERENCES "VerificationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
