-- Payment and Indexing System Migration
-- This migration adds all the new tables and enums for PR2: Backend + Payments + Indexing

-- Create payment-related enums
CREATE TYPE "PaymentType" AS ENUM ('LIFT_UNIT_PURCHASE', 'PROJECT_FUNDING', 'REPAYMENT', 'PLATFORM_FEE', 'STEWARD_PAYMENT');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_ESCROW', 'DISTRIBUTED', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentEventType" AS ENUM ('PAYMENT_INITIATED', 'PAYMENT_CONFIRMED', 'ESCROW_DEPOSITED', 'PROCEEDS_NOTIFIED', 'FUNDS_DISTRIBUTED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED');

-- Create Payment table
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

-- Create PaymentEvent table
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

-- Create IndexedEvent table
CREATE TABLE "IndexedEvent" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventSignature" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT NOT NULL,
    "txIndex" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "topics" JSONB NOT NULL,
    "data" TEXT NOT NULL,
    "decodedArgs" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "relatedPaymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexedEvent_pkey" PRIMARY KEY ("id")
);

-- Create IndexerState table
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "indexerType" TEXT NOT NULL,
    "lastBlockNumber" INTEGER NOT NULL DEFAULT 0,
    "lastBlockHash" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "startBlock" INTEGER NOT NULL DEFAULT 0,
    "confirmations" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- Create ProjectPaymentConfig table
CREATE TABLE "ProjectPaymentConfig" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "allocationEscrow" TEXT,
    "repaymentEscrow" TEXT,
    "acceptsPayments" BOOLEAN NOT NULL DEFAULT false,
    "paymentTokens" JSONB,
    "platformFeeBps" INTEGER,
    "platformFeeCap" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "IndexedEvent_chainId_txHash_logIndex_key" ON "IndexedEvent"("chainId", "txHash", "logIndex");
CREATE UNIQUE INDEX "IndexerState_chainId_contractAddress_indexerType_key" ON "IndexerState"("chainId", "contractAddress", "indexerType");
CREATE UNIQUE INDEX "ProjectPaymentConfig_projectId_key" ON "ProjectPaymentConfig"("projectId");

-- Create indexes for performance
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");
CREATE INDEX "Payment_payerAddress_idx" ON "Payment"("payerAddress");
CREATE INDEX "Payment_txHash_idx" ON "Payment"("txHash");
CREATE INDEX "Payment_chainId_idx" ON "Payment"("chainId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");
CREATE INDEX "PaymentEvent_type_idx" ON "PaymentEvent"("type");
CREATE INDEX "PaymentEvent_txHash_idx" ON "PaymentEvent"("txHash");
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

CREATE INDEX "IndexedEvent_chainId_contractAddress_idx" ON "IndexedEvent"("chainId", "contractAddress");
CREATE INDEX "IndexedEvent_eventName_idx" ON "IndexedEvent"("eventName");
CREATE INDEX "IndexedEvent_blockNumber_idx" ON "IndexedEvent"("blockNumber");
CREATE INDEX "IndexedEvent_processed_idx" ON "IndexedEvent"("processed");
CREATE INDEX "IndexedEvent_txHash_idx" ON "IndexedEvent"("txHash");
CREATE INDEX "IndexedEvent_createdAt_idx" ON "IndexedEvent"("createdAt");

CREATE INDEX "IndexerState_chainId_idx" ON "IndexerState"("chainId");
CREATE INDEX "IndexerState_isActive_idx" ON "IndexerState"("isActive");
CREATE INDEX "IndexerState_lastSyncAt_idx" ON "IndexerState"("lastSyncAt");

-- Add foreign key constraints
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IndexedEvent" ADD CONSTRAINT "IndexedEvent_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectPaymentConfig" ADD CONSTRAINT "ProjectPaymentConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;