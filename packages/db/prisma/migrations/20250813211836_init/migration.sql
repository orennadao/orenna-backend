-- CreateTable
CREATE TABLE "LiftToken" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "meta" TEXT,
    "issuedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftTokenEvent" (
    "id" SERIAL NOT NULL,
    "liftTokenId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "txId" TEXT,
    "payload" TEXT,
    "meta" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiftTokenEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerAddress" TEXT,
    "chainId" INTEGER,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiftToken_externalId_key" ON "LiftToken"("externalId");

-- CreateIndex
CREATE INDEX "LiftToken_status_idx" ON "LiftToken"("status");

-- CreateIndex
CREATE INDEX "LiftTokenEvent_liftTokenId_type_idx" ON "LiftTokenEvent"("liftTokenId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LiftTokenEvent_liftTokenId_type_txId_key" ON "LiftTokenEvent"("liftTokenId", "type", "txId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- AddForeignKey
ALTER TABLE "LiftTokenEvent" ADD CONSTRAINT "LiftTokenEvent_liftTokenId_fkey" FOREIGN KEY ("liftTokenId") REFERENCES "LiftToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
