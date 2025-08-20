-- CreateEnum
CREATE TYPE "MintRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'MINTING', 'COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MintRequestEventType" AS ENUM ('SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED', 'MINT_STARTED', 'MINT_COMPLETED', 'MINT_FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PROJECT_FUNDING', 'MILESTONE_PAYMENT', 'VERIFICATION_FEE', 'GOVERNANCE_STAKE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentEventType" AS ENUM ('PAYMENT_INITIATED', 'PAYMENT_CONFIRMED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'ESCROW_DEPOSITED', 'ESCROW_RELEASED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "username" TEXT,
    "ensName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerAddress" TEXT,
    "chainId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractAddress" TEXT,
    "meta" JSONB,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftToken" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "tokenId" TEXT,
    "contractAddress" TEXT,
    "chainId" INTEGER,
    "mintRequestId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "projectId" INTEGER,
    "meta" JSONB,
    "issuedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "verificationMethodId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftTokenEvent" (
    "id" SERIAL NOT NULL,
    "liftTokenId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "logIndex" INTEGER,
    "payload" JSONB,
    "meta" JSONB,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiftTokenEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MintRequest" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER,
    "requestHash" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MintRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MintRequestEvent" (
    "id" SERIAL NOT NULL,
    "mintRequestId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MintRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" INTEGER,
    "amount" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "payerAddress" TEXT NOT NULL,
    "payerEmail" TEXT,
    "recipientAddress" TEXT NOT NULL,
    "escrowContract" TEXT,
    "escrowConfig" JSONB,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "blockTimestamp" TIMESTAMP(3),
    "proceedsNotified" BOOLEAN NOT NULL DEFAULT false,
    "distributionComplete" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" "PaymentEventType" NOT NULL,
    "performedBy" TEXT,
    "amount" TEXT,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "logIndex" INTEGER,
    "gasUsed" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPaymentConfig" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "acceptedCurrency" TEXT NOT NULL,
    "paymentAddress" TEXT NOT NULL,
    "minAmount" TEXT,
    "maxAmount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "abi" JSONB NOT NULL,
    "deploymentTx" TEXT,
    "deployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexedEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "lastBlock" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_externalId_key" ON "LiftToken"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_tokenId_key" ON "LiftToken"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_mintRequestId_key" ON "LiftToken"("mintRequestId");

-- CreateIndex
CREATE INDEX "LiftToken_status_idx" ON "LiftToken"("status");

-- CreateIndex
CREATE INDEX "LiftToken_tokenId_idx" ON "LiftToken"("tokenId");

-- CreateIndex
CREATE INDEX "LiftToken_contractAddress_idx" ON "LiftToken"("contractAddress");

-- CreateIndex
CREATE INDEX "LiftToken_chainId_idx" ON "LiftToken"("chainId");

-- CreateIndex
CREATE INDEX "LiftTokenEvent_liftTokenId_type_idx" ON "LiftTokenEvent"("liftTokenId", "type");

-- CreateIndex
CREATE INDEX "LiftTokenEvent_txHash_idx" ON "LiftTokenEvent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "LiftTokenEvent_liftTokenId_type_txHash_key" ON "LiftTokenEvent"("liftTokenId", "type", "txHash");

-- CreateIndex
CREATE UNIQUE INDEX "MintRequest_requestHash_key" ON "MintRequest"("requestHash");

-- CreateIndex
CREATE INDEX "Payment_chainId_idx" ON "Payment"("chainId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_payerAddress_idx" ON "Payment"("payerAddress");

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_txHash_idx" ON "Payment"("txHash");

-- CreateIndex
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentEvent_txHash_idx" ON "PaymentEvent"("txHash");

-- CreateIndex
CREATE INDEX "PaymentEvent_type_idx" ON "PaymentEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPaymentConfig_projectId_key" ON "ProjectPaymentConfig"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_address_chainId_key" ON "Contract"("address", "chainId");

-- CreateIndex
CREATE INDEX "IndexedEvent_contractAddress_chainId_idx" ON "IndexedEvent"("contractAddress", "chainId");

-- CreateIndex
CREATE INDEX "IndexedEvent_blockNumber_idx" ON "IndexedEvent"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IndexedEvent_txHash_logIndex_key" ON "IndexedEvent"("txHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerState_contractAddress_chainId_key" ON "IndexerState"("contractAddress", "chainId");

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

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES "MintRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_verificationMethodId_fkey" FOREIGN KEY ("verificationMethodId") REFERENCES "VerificationMethod"("methodId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftTokenEvent" ADD CONSTRAINT "LiftTokenEvent_liftTokenId_fkey" FOREIGN KEY ("liftTokenId") REFERENCES "LiftToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintRequest" ADD CONSTRAINT "MintRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintRequestEvent" ADD CONSTRAINT "MintRequestEvent_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES "MintRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPaymentConfig" ADD CONSTRAINT "ProjectPaymentConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_liftTokenId_fkey" FOREIGN KEY ("liftTokenId") REFERENCES "LiftToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "VerificationMethod"("methodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_verificationResultId_fkey" FOREIGN KEY ("verificationResultId") REFERENCES "VerificationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

