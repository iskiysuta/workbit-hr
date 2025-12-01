-- CreateTable
CREATE TABLE "ShiftSwapRequest" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ShiftSwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftSwapRequest_requesterId_date_idx" ON "ShiftSwapRequest"("requesterId", "date");

-- CreateIndex
CREATE INDEX "ShiftSwapRequest_targetId_date_idx" ON "ShiftSwapRequest"("targetId", "date");

-- AddForeignKey
ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
