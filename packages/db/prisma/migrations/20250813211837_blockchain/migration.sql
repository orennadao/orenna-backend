-- DropIndex
DROP INDEX "LiftTokenEvent_liftTokenId_type_txId_key";

-- AlterTable
ALTER TABLE "LiftToken" ADD COLUMN     "chainId" INTEGER,
ADD COLUMN     "contractAddress" TEXT,
ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "tokenId" TEXT,
DROP COLUMN "meta",
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "LiftTokenEvent" DROP COLUMN "txId",
ADD COLUMN     "blockNumber" INTEGER,
ADD COLUMN     "logIndex" INTEGER,
ADD COLUMN     "txHash" TEXT,
DROP COLUMN "payload",
ADD COLUMN     "payload" JSONB,
DROP COLUMN "meta",
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "contractAddress" TEXT,
DROP COLUMN "meta",
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ensName" TEXT;

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
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "abi" JSONB,
    "deployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Contract_chainId_type_idx" ON "Contract"("chainId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_address_chainId_key" ON "Contract"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_tokenId_key" ON "LiftToken"("tokenId");

-- CreateIndex
CREATE INDEX "LiftToken_tokenId_idx" ON "LiftToken"("tokenId");

-- CreateIndex
CREATE INDEX "LiftToken_contractAddress_idx" ON "LiftToken"("contractAddress");

-- CreateIndex
CREATE INDEX "LiftToken_chainId_idx" ON "LiftToken"("chainId");

-- CreateIndex
CREATE INDEX "LiftTokenEvent_txHash_idx" ON "LiftTokenEvent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "LiftTokenEvent_liftTokenId_type_txHash_key" ON "LiftTokenEvent"("liftTokenId", "type", "txHash");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftToken" ADD CONSTRAINT "LiftToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

