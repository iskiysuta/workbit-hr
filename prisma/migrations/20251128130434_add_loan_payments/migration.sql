-- AlterTable
ALTER TABLE "EmployeeLoan" ADD COLUMN     "paidMonths" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EmployeeLoanPayment" (
    "id" SERIAL NOT NULL,
    "employeeLoanId" INTEGER NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeLoanPayment_employeeLoanId_idx" ON "EmployeeLoanPayment"("employeeLoanId");

-- CreateIndex
CREATE INDEX "EmployeeLoanPayment_payrollPeriodId_idx" ON "EmployeeLoanPayment"("payrollPeriodId");

-- AddForeignKey
ALTER TABLE "EmployeeLoanPayment" ADD CONSTRAINT "EmployeeLoanPayment_employeeLoanId_fkey" FOREIGN KEY ("employeeLoanId") REFERENCES "EmployeeLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoanPayment" ADD CONSTRAINT "EmployeeLoanPayment_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
