-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "jobId" INTEGER;

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalSalary" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
