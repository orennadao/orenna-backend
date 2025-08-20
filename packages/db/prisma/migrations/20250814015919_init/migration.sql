/*
  Warnings:

  - A unique constraint covering the columns `[mintRequestId]` on the table `LiftToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MintRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'MINTING', 'COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MintRequestEventType" AS ENUM ('SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED', 'MINT_STARTED', 'MINT_COMPLETED', 'MINT_FAILED');

-- AlterTable
ALTER TABLE "LiftToken" ADD COLUMN     "mintRequestId" TEXT;

-- CreateTable
CREATE TABLE "MintRequest" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "tokenId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "verificationData" JSONB,
    "verificationHash" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedBy" TEXT NOT NULL,
    "status" "MintRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MintRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MintRequestEvent" (
    "id" TEXT NOT NULL,
    "mintRequestId" TEXT NOT NULL,
    "type" "MintRequestEventType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MintRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MintRequest_status_idx" ON "MintRequest"("status");

-- CreateIndex
CREATE INDEX "MintRequest_projectId_idx" ON "MintRequest"("projectId");

-- CreateIndex
CREATE INDEX "MintRequest_requestedBy_idx" ON "MintRequest"("requestedBy");

-- CreateIndex
CREATE INDEX "MintRequest_createdAt_idx" ON "MintRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MintRequestEvent_mintRequestId_idx" ON "MintRequestEvent"("mintRequestId");

-- CreateIndex
CREATE INDEX "MintRequestEvent_type_idx" ON "MintRequestEvent"("type");

-- CreateIndex
CREATE INDEX "MintRequestEvent_createdAt_idx" ON "MintRequestEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_mintRequestId_key" ON "LiftToken"("mintRequestId");

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES "MintRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintRequest" ADD CONSTRAINT "MintRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintRequestEvent" ADD CONSTRAINT "MintRequestEvent_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES "MintRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
