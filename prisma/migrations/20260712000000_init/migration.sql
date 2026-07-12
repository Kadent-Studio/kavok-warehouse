-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('operator', 'admin');

-- CreateEnum
CREATE TYPE "TrackingType" AS ENUM ('serial', 'lot');

-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('rotable', 'consumable', 'expendable');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('serviceable', 'unserviceable', 'scrap');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('initial_stock', 'receipt', 'dispatch', 'transfer', 'status_change');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'operator',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trackingType" "TrackingType" NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "ataChapter" TEXT,
    "category" "PartCategory" NOT NULL,
    "shelfLifeDays" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartAlternate" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "alternateId" TEXT NOT NULL,

    CONSTRAINT "PartAlternate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "lotNumber" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "zone" TEXT NOT NULL,
    "shelf" TEXT NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'serviceable',
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromZone" TEXT,
    "fromShelf" TEXT,
    "toZone" TEXT,
    "toShelf" TEXT,
    "supplier" TEXT,
    "recipient" TEXT,
    "referenceNumber" TEXT,
    "reason" TEXT,
    "previousStatus" "StockStatus",
    "newStatus" "StockStatus",
    "notes" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partNumber_key" ON "Part"("partNumber");

-- CreateIndex
CREATE INDEX "Part_partNumber_idx" ON "Part"("partNumber");

-- CreateIndex
CREATE INDEX "Part_archived_idx" ON "Part"("archived");

-- CreateIndex
CREATE UNIQUE INDEX "PartAlternate_partId_alternateId_key" ON "PartAlternate"("partId", "alternateId");

-- CreateIndex
CREATE INDEX "StockItem_partId_idx" ON "StockItem"("partId");

-- CreateIndex
CREATE INDEX "StockItem_status_idx" ON "StockItem"("status");

-- CreateIndex
CREATE INDEX "StockItem_expirationDate_idx" ON "StockItem"("expirationDate");

-- CreateIndex
CREATE INDEX "StockItem_zone_shelf_idx" ON "StockItem"("zone", "shelf");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_partId_serialNumber_key" ON "StockItem"("partId", "serialNumber");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_idx" ON "StockMovement"("stockItemId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_timestamp_idx" ON "StockMovement"("timestamp");

-- CreateIndex
CREATE INDEX "StockMovement_userId_idx" ON "StockMovement"("userId");

-- AddForeignKey
ALTER TABLE "PartAlternate" ADD CONSTRAINT "PartAlternate_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAlternate" ADD CONSTRAINT "PartAlternate_alternateId_fkey" FOREIGN KEY ("alternateId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

