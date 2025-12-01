-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" SERIAL NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "totalSalary" INTEGER NOT NULL,
    "isFullSalaryPayroll" BOOLEAN NOT NULL,
    "scheduledWorkingDays" INTEGER NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "offDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "lateCount" INTEGER NOT NULL,
    "totalLateMinutes" INTEGER NOT NULL,
    "totalWorkMinutes" INTEGER NOT NULL,
    "loanInstallment" INTEGER NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "positionAllowance" INTEGER NOT NULL,
    "transportAllowance" INTEGER NOT NULL,
    "mealAllowance" INTEGER NOT NULL,
    "healthAllowance" INTEGER NOT NULL,
    "grossBeforePenalty" INTEGER NOT NULL,
    "latePenalty" INTEGER NOT NULL,
    "extraDeduction" INTEGER NOT NULL,
    "extraAddition" INTEGER NOT NULL,
    "thp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_year_month_key" ON "PayrollPeriod"("year", "month");

-- CreateIndex
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
