-- CreateTable
CREATE TABLE "LiftUnit" (
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

    CONSTRAINT "LiftUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftUnitEvent" (
    "id" SERIAL NOT NULL,
    "liftUnitId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "txId" TEXT,
    "payload" TEXT,
    "meta" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiftUnitEvent_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "LiftUnit_externalId_key" ON "LiftUnit"("externalId");

-- CreateIndex
CREATE INDEX "LiftUnit_status_idx" ON "LiftUnit"("status");

-- CreateIndex
CREATE INDEX "LiftUnitEvent_liftUnitId_type_idx" ON "LiftUnitEvent"("liftUnitId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LiftUnitEvent_liftUnitId_type_txId_key" ON "LiftUnitEvent"("liftUnitId", "type", "txId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- AddForeignKey
ALTER TABLE "LiftUnitEvent" ADD CONSTRAINT "LiftUnitEvent_liftUnitId_fkey" FOREIGN KEY ("liftUnitId") REFERENCES "LiftUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
