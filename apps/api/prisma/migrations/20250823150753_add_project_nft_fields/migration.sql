-- Add Project NFT fields to maintain consistency with blockchain
ALTER TABLE "Project" ADD COLUMN "projectNftId" INTEGER;
ALTER TABLE "Project" ADD COLUMN "projectNftChainId" INTEGER;
ALTER TABLE "Project" ADD COLUMN "tokenURI" TEXT;
ALTER TABLE "Project" ADD COLUMN "registryDataURI" TEXT;
ALTER TABLE "Project" ADD COLUMN "dataHash" TEXT;
ALTER TABLE "Project" ADD COLUMN "nftState" INTEGER;

-- Create unique constraint and index
CREATE UNIQUE INDEX "Project_projectNftId_projectNftChainId_key" ON "Project"("projectNftId", "projectNftChainId");
CREATE INDEX "Project_projectNftId_projectNftChainId_idx" ON "Project"("projectNftId", "projectNftChainId");