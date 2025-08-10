/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "LiftUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quantity" DECIMAL,
    "unit" TEXT,
    "meta" TEXT,
    "issuedAt" DATETIME,
    "retiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LiftUnitEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "liftUnitId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "txId" TEXT,
    "payload" TEXT,
    "meta" TEXT,
    "eventAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiftUnitEvent_liftUnitId_fkey" FOREIGN KEY ("liftUnitId") REFERENCES "LiftUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LiftUnit_externalId_key" ON "LiftUnit"("externalId");

-- CreateIndex
CREATE INDEX "LiftUnit_status_idx" ON "LiftUnit"("status");

-- CreateIndex
CREATE INDEX "LiftUnitEvent_liftUnitId_type_idx" ON "LiftUnitEvent"("liftUnitId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LiftUnitEvent_liftUnitId_type_txId_key" ON "LiftUnitEvent"("liftUnitId", "type", "txId");
