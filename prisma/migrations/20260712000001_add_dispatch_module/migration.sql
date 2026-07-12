-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('aircraft', 'other');

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "dispatchOrderId" TEXT;

-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "model" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchOrder" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "deliveredBy" TEXT NOT NULL,
    "destinationType" "DestinationType" NOT NULL,
    "aircraftId" TEXT,
    "destinationText" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_registration_key" ON "Aircraft"("registration");

-- CreateIndex
CREATE INDEX "Aircraft_active_idx" ON "Aircraft"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchOrder_number_key" ON "DispatchOrder"("number");

-- CreateIndex
CREATE INDEX "DispatchOrder_createdAt_idx" ON "DispatchOrder"("createdAt");

-- CreateIndex
CREATE INDEX "DispatchOrder_aircraftId_idx" ON "DispatchOrder"("aircraftId");

-- CreateIndex
CREATE INDEX "DispatchOrder_userId_idx" ON "DispatchOrder"("userId");

-- CreateIndex
CREATE INDEX "StockMovement_dispatchOrderId_idx" ON "StockMovement"("dispatchOrderId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_dispatchOrderId_fkey" FOREIGN KEY ("dispatchOrderId") REFERENCES "DispatchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchOrder" ADD CONSTRAINT "DispatchOrder_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchOrder" ADD CONSTRAINT "DispatchOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

