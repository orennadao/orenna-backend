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

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('STANDARD', 'MAJOR', 'EMERGENCY', 'ECOSYSTEM_PARAMETER', 'METHOD_REGISTRY', 'PROTOCOL_UPGRADE', 'TREASURY_ALLOCATION', 'LIFT_TOKEN_GOVERNANCE', 'FINANCE_PLATFORM', 'FEE_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'PENDING_SPONSORSHIP', 'PENDING', 'ACTIVE', 'CANCELED', 'DEFEATED', 'SUCCEEDED', 'QUEUED', 'EXPIRED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "VoteSupport" AS ENUM ('AGAINST', 'FOR', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "LiftForwardStatus" AS ENUM ('DRAFT', 'APPROVED', 'FUNDED', 'ACTIVE', 'MILESTONE_SUBMITTED', 'MILESTONE_ACCEPTED', 'MILESTONE_CHALLENGED', 'COMPLETED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'CHALLENGED', 'REJECTED', 'APPEALED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'UPHELD', 'REJECTED', 'APPEALED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_MEDIATION', 'UNDER_REVIEW', 'RESOLVED', 'APPEALED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TreasuryTransactionType" AS ENUM ('DISBURSEMENT', 'ALLOCATION', 'TRANSFER', 'REPAYMENT', 'CLAWBACK', 'EMERGENCY_WITHDRAWAL');

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
    "projectNftId" INTEGER,
    "projectNftChainId" INTEGER,
    "tokenURI" TEXT,
    "registryDataURI" TEXT,
    "dataHash" TEXT,
    "nftState" INTEGER,
    "contractAddress" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "status" "MintRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MintRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MintRequestEvent" (
    "id" SERIAL NOT NULL,
    "mintRequestId" INTEGER NOT NULL,
    "eventType" "MintRequestEventType" NOT NULL,
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

-- CreateTable
CREATE TABLE "GovernanceToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "balance" TEXT NOT NULL DEFAULT '0',
    "votingPower" TEXT NOT NULL DEFAULT '0',
    "delegatedTo" TEXT,
    "delegatedAmount" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceDelegation" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "delegatorAddress" TEXT NOT NULL,
    "delegateeAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "GovernanceDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceProposal" (
    "id" SERIAL NOT NULL,
    "proposalId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposalType" "ProposalType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "targets" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "calldatas" TEXT NOT NULL,
    "ecosystemData" JSONB,
    "methodRegistryData" JSONB,
    "financeData" JSONB,
    "liftTokenData" JSONB,
    "ipfsHash" TEXT,
    "metadataUri" TEXT,
    "proposerAddress" TEXT NOT NULL,
    "proposerUserId" INTEGER,
    "forVotes" TEXT NOT NULL DEFAULT '0',
    "againstVotes" TEXT NOT NULL DEFAULT '0',
    "abstainVotes" TEXT NOT NULL DEFAULT '0',
    "quorumRequired" TEXT,
    "startBlock" INTEGER,
    "endBlock" INTEGER,
    "snapshotBlock" INTEGER,
    "queuedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "antispamDeposit" TEXT DEFAULT '250',
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositRefunded" BOOLEAN NOT NULL DEFAULT false,
    "timelockEta" TIMESTAMP(3),
    "timelockDelay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceSponsorship" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "sponsorAddress" TEXT NOT NULL,
    "sponsorUserId" INTEGER,
    "votingPower" TEXT NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceSponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceVote" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "voterAddress" TEXT NOT NULL,
    "voterUserId" INTEGER,
    "support" "VoteSupport" NOT NULL,
    "votingPower" TEXT NOT NULL,
    "reason" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceEvent" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceParameter" (
    "id" SERIAL NOT NULL,
    "parameterKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "previousValue" TEXT,
    "dataType" TEXT NOT NULL,
    "description" TEXT,
    "lastChangedBy" TEXT,
    "lastChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceParameterChange" (
    "id" SERIAL NOT NULL,
    "parameterId" INTEGER NOT NULL,
    "proposalId" TEXT,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "implementedBy" TEXT,
    "emergencyOverride" BOOLEAN NOT NULL DEFAULT false,
    "emergencyReason" TEXT,
    "implementedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceParameterChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftForward" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "projectNftId" INTEGER,
    "projectNftChainId" INTEGER,
    "status" "LiftForwardStatus" NOT NULL DEFAULT 'DRAFT',
    "escrowContract" TEXT,
    "escrowChainId" INTEGER,
    "totalAmount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "funderAddress" TEXT NOT NULL,
    "funderUserId" INTEGER,
    "template" TEXT NOT NULL,
    "verifierAddress" TEXT,
    "challengeWindow" INTEGER NOT NULL DEFAULT 14,
    "approvedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "defaultedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftForward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftForwardMilestone" (
    "id" SERIAL NOT NULL,
    "liftForwardId" INTEGER NOT NULL,
    "milestoneNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceTypes" TEXT NOT NULL,
    "evidenceSubmitted" JSONB,
    "mrvBundleHash" TEXT,
    "mrvBundleIpfs" TEXT,
    "deadline" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "challengedAt" TIMESTAMP(3),
    "challengeWindowEnd" TIMESTAMP(3),
    "verifierAddress" TEXT,
    "verifierNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftForwardMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneChallenge" (
    "id" SERIAL NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "challengerAddress" TEXT NOT NULL,
    "challengerUserId" INTEGER,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "challengeReason" TEXT NOT NULL,
    "evidenceHash" TEXT,
    "evidenceIpfs" TEXT,
    "bondAmount" TEXT DEFAULT '100',
    "bondPaid" BOOLEAN NOT NULL DEFAULT false,
    "reviewerPanel" TEXT,
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "resolutionAt" TIMESTAMP(3),
    "appealSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "appealEvidence" TEXT,
    "appealResolution" TEXT,
    "appealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftForwardEvent" (
    "id" SERIAL NOT NULL,
    "liftForwardId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiftForwardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "claimantAddress" TEXT NOT NULL,
    "claimantUserId" INTEGER,
    "respondentAddress" TEXT,
    "respondentUserId" INTEGER,
    "evidenceHash" TEXT,
    "evidenceIpfs" TEXT,
    "requestedRemedy" TEXT NOT NULL,
    "mediatorAddress" TEXT,
    "mediationNotes" TEXT,
    "mediationEnd" TIMESTAMP(3),
    "resolutionProposalId" TEXT,
    "resolutionNotes" TEXT,
    "resolutionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvent" (
    "id" SERIAL NOT NULL,
    "disputeId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryTransaction" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" "TreasuryTransactionType" NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "proposalId" TEXT,
    "authorizingDocument" TEXT,
    "requiredSignatures" INTEGER NOT NULL DEFAULT 1,
    "collectedSignatures" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "chainId" INTEGER,
    "executedAt" TIMESTAMP(3),
    "description" TEXT,
    "category" TEXT,
    "vendorInfo" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasurySignature" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "signerAddress" TEXT NOT NULL,
    "signerUserId" INTEGER,
    "signature" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasurySignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "userAddress" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Project_projectNftId_projectNftChainId_idx" ON "Project"("projectNftId", "projectNftChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectNftId_projectNftChainId_key" ON "Project"("projectNftId", "projectNftChainId");

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

-- CreateIndex
CREATE INDEX "GovernanceToken_tokenAddress_chainId_idx" ON "GovernanceToken"("tokenAddress", "chainId");

-- CreateIndex
CREATE INDEX "GovernanceToken_delegatedTo_idx" ON "GovernanceToken"("delegatedTo");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceToken_userId_tokenAddress_chainId_key" ON "GovernanceToken"("userId", "tokenAddress", "chainId");

-- CreateIndex
CREATE INDEX "GovernanceDelegation_delegatorAddress_idx" ON "GovernanceDelegation"("delegatorAddress");

-- CreateIndex
CREATE INDEX "GovernanceDelegation_delegateeAddress_idx" ON "GovernanceDelegation"("delegateeAddress");

-- CreateIndex
CREATE INDEX "GovernanceDelegation_active_idx" ON "GovernanceDelegation"("active");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceDelegation_tokenId_delegatorAddress_active_key" ON "GovernanceDelegation"("tokenId", "delegatorAddress", "active");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceProposal_proposalId_key" ON "GovernanceProposal"("proposalId");

-- CreateIndex
CREATE INDEX "GovernanceProposal_chainId_idx" ON "GovernanceProposal"("chainId");

-- CreateIndex
CREATE INDEX "GovernanceProposal_status_idx" ON "GovernanceProposal"("status");

-- CreateIndex
CREATE INDEX "GovernanceProposal_proposalType_idx" ON "GovernanceProposal"("proposalType");

-- CreateIndex
CREATE INDEX "GovernanceProposal_proposerAddress_idx" ON "GovernanceProposal"("proposerAddress");

-- CreateIndex
CREATE INDEX "GovernanceProposal_startBlock_idx" ON "GovernanceProposal"("startBlock");

-- CreateIndex
CREATE INDEX "GovernanceProposal_endBlock_idx" ON "GovernanceProposal"("endBlock");

-- CreateIndex
CREATE INDEX "GovernanceSponsorship_proposalId_idx" ON "GovernanceSponsorship"("proposalId");

-- CreateIndex
CREATE INDEX "GovernanceSponsorship_sponsorAddress_idx" ON "GovernanceSponsorship"("sponsorAddress");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceSponsorship_proposalId_sponsorAddress_key" ON "GovernanceSponsorship"("proposalId", "sponsorAddress");

-- CreateIndex
CREATE INDEX "GovernanceVote_proposalId_idx" ON "GovernanceVote"("proposalId");

-- CreateIndex
CREATE INDEX "GovernanceVote_voterAddress_idx" ON "GovernanceVote"("voterAddress");

-- CreateIndex
CREATE INDEX "GovernanceVote_support_idx" ON "GovernanceVote"("support");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceVote_proposalId_voterAddress_key" ON "GovernanceVote"("proposalId", "voterAddress");

-- CreateIndex
CREATE INDEX "GovernanceEvent_proposalId_idx" ON "GovernanceEvent"("proposalId");

-- CreateIndex
CREATE INDEX "GovernanceEvent_eventType_idx" ON "GovernanceEvent"("eventType");

-- CreateIndex
CREATE INDEX "GovernanceEvent_txHash_idx" ON "GovernanceEvent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceParameter_parameterKey_key" ON "GovernanceParameter"("parameterKey");

-- CreateIndex
CREATE INDEX "GovernanceParameter_category_idx" ON "GovernanceParameter"("category");

-- CreateIndex
CREATE INDEX "GovernanceParameterChange_parameterId_idx" ON "GovernanceParameterChange"("parameterId");

-- CreateIndex
CREATE INDEX "GovernanceParameterChange_proposalId_idx" ON "GovernanceParameterChange"("proposalId");

-- CreateIndex
CREATE INDEX "GovernanceParameterChange_implementedAt_idx" ON "GovernanceParameterChange"("implementedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiftForward_proposalId_key" ON "LiftForward"("proposalId");

-- CreateIndex
CREATE INDEX "LiftForward_status_idx" ON "LiftForward"("status");

-- CreateIndex
CREATE INDEX "LiftForward_funderAddress_idx" ON "LiftForward"("funderAddress");

-- CreateIndex
CREATE INDEX "LiftForward_escrowContract_idx" ON "LiftForward"("escrowContract");

-- CreateIndex
CREATE INDEX "LiftForward_projectNftId_projectNftChainId_idx" ON "LiftForward"("projectNftId", "projectNftChainId");

-- CreateIndex
CREATE INDEX "LiftForwardMilestone_status_idx" ON "LiftForwardMilestone"("status");

-- CreateIndex
CREATE INDEX "LiftForwardMilestone_deadline_idx" ON "LiftForwardMilestone"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "LiftForwardMilestone_liftForwardId_milestoneNumber_key" ON "LiftForwardMilestone"("liftForwardId", "milestoneNumber");

-- CreateIndex
CREATE INDEX "MilestoneChallenge_milestoneId_idx" ON "MilestoneChallenge"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneChallenge_challengerAddress_idx" ON "MilestoneChallenge"("challengerAddress");

-- CreateIndex
CREATE INDEX "MilestoneChallenge_status_idx" ON "MilestoneChallenge"("status");

-- CreateIndex
CREATE INDEX "LiftForwardEvent_liftForwardId_idx" ON "LiftForwardEvent"("liftForwardId");

-- CreateIndex
CREATE INDEX "LiftForwardEvent_eventType_idx" ON "LiftForwardEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_ticketNumber_key" ON "Dispute"("ticketNumber");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_category_idx" ON "Dispute"("category");

-- CreateIndex
CREATE INDEX "Dispute_claimantAddress_idx" ON "Dispute"("claimantAddress");

-- CreateIndex
CREATE INDEX "DisputeEvent_disputeId_idx" ON "DisputeEvent"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeEvent_eventType_idx" ON "DisputeEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryTransaction_transactionId_key" ON "TreasuryTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_type_idx" ON "TreasuryTransaction"("type");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_status_idx" ON "TreasuryTransaction"("status");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_proposalId_idx" ON "TreasuryTransaction"("proposalId");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_executedAt_idx" ON "TreasuryTransaction"("executedAt");

-- CreateIndex
CREATE INDEX "TreasurySignature_transactionId_idx" ON "TreasurySignature"("transactionId");

-- CreateIndex
CREATE INDEX "TreasurySignature_signerAddress_idx" ON "TreasurySignature"("signerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TreasurySignature_transactionId_signerAddress_key" ON "TreasurySignature"("transactionId", "signerAddress");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

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

-- AddForeignKey
ALTER TABLE "GovernanceToken" ADD CONSTRAINT "GovernanceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDelegation" ADD CONSTRAINT "GovernanceDelegation_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "GovernanceToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceProposal" ADD CONSTRAINT "GovernanceProposal_proposerUserId_fkey" FOREIGN KEY ("proposerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceSponsorship" ADD CONSTRAINT "GovernanceSponsorship_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceSponsorship" ADD CONSTRAINT "GovernanceSponsorship_sponsorUserId_fkey" FOREIGN KEY ("sponsorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_voterUserId_fkey" FOREIGN KEY ("voterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceEvent" ADD CONSTRAINT "GovernanceEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceParameterChange" ADD CONSTRAINT "GovernanceParameterChange_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "GovernanceParameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftForward" ADD CONSTRAINT "LiftForward_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftForward" ADD CONSTRAINT "LiftForward_funderUserId_fkey" FOREIGN KEY ("funderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftForwardMilestone" ADD CONSTRAINT "LiftForwardMilestone_liftForwardId_fkey" FOREIGN KEY ("liftForwardId") REFERENCES "LiftForward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneChallenge" ADD CONSTRAINT "MilestoneChallenge_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "LiftForwardMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneChallenge" ADD CONSTRAINT "MilestoneChallenge_challengerUserId_fkey" FOREIGN KEY ("challengerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftForwardEvent" ADD CONSTRAINT "LiftForwardEvent_liftForwardId_fkey" FOREIGN KEY ("liftForwardId") REFERENCES "LiftForward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_respondentUserId_fkey" FOREIGN KEY ("respondentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvent" ADD CONSTRAINT "DisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasurySignature" ADD CONSTRAINT "TreasurySignature_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TreasuryTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasurySignature" ADD CONSTRAINT "TreasurySignature_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

