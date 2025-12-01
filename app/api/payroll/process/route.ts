import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatTimeHHmm(date: Date | null | undefined) {
  if (!date) return null;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function calculateLatenessMinutes(
  scheduledStart: string,
  scheduledEnd: string,
  actualIn: string | null,
  graceMinutes: number
): number {
  if (!scheduledStart || !actualIn) return 0;
  const [sh, sm] = scheduledStart.split(":").map((n) => Number(n));
  const [eh, em] = scheduledEnd.split(":").map((n) => Number(n));
  const [ah, am] = actualIn.split(":").map((n) => Number(n));
  if ([sh, sm, eh, em, ah, am].some((n) => Number.isNaN(n))) return 0;

  const scheduledTotal = sh * 60 + sm;
  const scheduledEndTotal = eh * 60 + em;
  let actualTotal = ah * 60 + am;

  const isOvernight = scheduledEndTotal < scheduledTotal;
  if (isOvernight && ah < sh && ah < 12) {
    actualTotal += 24 * 60;
  }

  const diff = actualTotal - scheduledTotal;
  if (diff <= 0) return 0;
  const late = diff - graceMinutes;
  return late > 0 ? late : 0;
}

function calculateWorkMinutes(timeIn: string | null, timeOut: string | null): number {
  if (!timeIn || !timeOut) return 0;
  const [ihStr, imStr] = timeIn.split(":");
  const [ohStr, omStr] = timeOut.split(":");
  const ih = Number(ihStr);
  const im = Number(imStr);
  const oh = Number(ohStr);
  const om = Number(omStr);
  if ([ih, im, oh, om].some((n) => Number.isNaN(n))) return 0;

  const inMinutes = ih * 60 + im;
  let outMinutes = oh * 60 + om;

  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60;
  }

  const diff = outMinutes - inMinutes;
  return diff > 0 ? diff : 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const monthParam = body.month as string | undefined; // YYYY-MM
    const adjustments = (body.adjustments || []) as Array<{
      employeeId: number;
      extraDeduction?: number;
      extraAddition?: number;
    }>;

    if (!monthParam) {
      return NextResponse.json(
        { message: "Parameter bulan wajib diisi (format YYYY-MM)" },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = monthParam.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr); // 1-12

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Format bulan tidak valid" },
        { status: 400 }
      );
    }

    // Periode: 26 bulan sebelumnya s/d 25 bulan yang dipilih (lt 26 bulan yg dipilih)
    const periodEnd = new Date(year, month - 1, 26); // 26 current month
    const periodStart = new Date(year, month - 2, 26); // 26 previous month

    // Cek apakah periode sudah pernah diproses
    const existing = await prisma.payrollPeriod.findUnique({
      where: { year_month: { year, month } },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Periode payroll ini sudah diproses (terkunci)" },
        { status: 400 }
      );
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            companyId: true,
            job: {
              select: {
                level: true,
                title: true,
                totalSalary: true,
                isFullSalaryPayroll: true,
              },
            },
          },
        },
        shift: true,
        attendance: true,
      },
    });

    const loans = await prisma.employeeLoan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeId: true,
        months: true,
        paidMonths: true,
        installment: true,
      },
    });

    const loanByEmployee = new Map<number, number>();
    for (const l of loans) {
      const prev = loanByEmployee.get(l.employeeId) ?? 0;
      loanByEmployee.set(l.employeeId, prev + l.installment);
    }

    type PayrollAgg = {
      employeeId: number;
      companyId: string;
      name: string;
      jobLevel: string | null;
      jobTitle: string | null;
      totalSalary: number;
      isFullSalaryPayroll: boolean;
      scheduledWorkingDays: number;
      workingDays: number; // hadir
      offDays: number;
      absentDays: number;
      lateCount: number;
      totalLateMinutes: number;
      totalWorkMinutes: number;
    };

    const aggByEmployee = new Map<number, PayrollAgg>();

    for (const s of schedules) {
      const emp = s.employee;
      const job = emp.job;
      let agg = aggByEmployee.get(emp.id);
      if (!agg) {
        agg = {
          employeeId: emp.id,
          companyId: emp.companyId,
          name: emp.name,
          jobLevel: job?.level ?? null,
          jobTitle: job?.title ?? null,
          totalSalary: job?.totalSalary ?? 0,
          isFullSalaryPayroll: job?.isFullSalaryPayroll ?? false,
          scheduledWorkingDays: 0,
          workingDays: 0,
          offDays: 0,
          absentDays: 0,
          lateCount: 0,
          totalLateMinutes: 0,
          totalWorkMinutes: 0,
        };
        aggByEmployee.set(emp.id, agg);
      }

      const isDayOff = s.shift.isDayOff;
      if (isDayOff) {
        agg.offDays += 1;
        continue;
      }

      agg.scheduledWorkingDays += 1;

      const timeInStr = formatTimeHHmm(s.attendance?.timeIn ?? null);
      const timeOutStr = formatTimeHHmm(s.attendance?.timeOut ?? null);

      if (!timeInStr) {
        agg.absentDays += 1;
        continue;
      }

      agg.workingDays += 1;

      const lateMinutes = calculateLatenessMinutes(
        s.shift.startTime,
        s.shift.endTime,
        timeInStr,
        s.shift.gracePeriodMinutes
      );
      if (lateMinutes > 0) {
        agg.lateCount += 1;
        agg.totalLateMinutes += lateMinutes;
      }

      const workMinutes = calculateWorkMinutes(timeInStr, timeOutStr);
      agg.totalWorkMinutes += workMinutes;
    }

    const allEmployees = await prisma.employee.findMany({
      include: {
        job: {
          select: {
            level: true,
            title: true,
            totalSalary: true,
            isFullSalaryPayroll: true,
          },
        },
      },
    });

    for (const emp of allEmployees) {
      if (!aggByEmployee.has(emp.id)) {
        const job = emp.job;
        aggByEmployee.set(emp.id, {
          employeeId: emp.id,
          companyId: emp.companyId,
          name: emp.name,
          jobLevel: job?.level ?? null,
          jobTitle: job?.title ?? null,
          totalSalary: job?.totalSalary ?? 0,
          isFullSalaryPayroll: job?.isFullSalaryPayroll ?? false,
          scheduledWorkingDays: 0,
          workingDays: 0,
          offDays: 0,
          absentDays: 0,
          lateCount: 0,
          totalLateMinutes: 0,
          totalWorkMinutes: 0,
        });
      }
    }

    const adjustmentMap = new Map<
      number,
      { extraDeduction: number; extraAddition: number }
    >();
    for (const adj of adjustments) {
      const empId = Number(adj.employeeId);
      if (Number.isNaN(empId)) continue;
      adjustmentMap.set(empId, {
        extraDeduction: Number(adj.extraDeduction || 0),
        extraAddition: Number(adj.extraAddition || 0),
      });
    }

    const itemsData = Array.from(aggByEmployee.values()).map((agg) => {
      const totalSalary = agg.totalSalary;
      const baseSalary = totalSalary * 0.56;
      const positionAllowance = totalSalary * 0.15;
      const transportAllowance = totalSalary * 0.1;
      const mealAllowance = totalSalary * 0.14;
      const healthAllowance = totalSalary * 0.05;

      const workingDays = agg.workingDays;

      let grossBeforePenalty = totalSalary;
      let latePenalty = 0;

      if (!agg.isFullSalaryPayroll) {
        const baseSalaryPart = (baseSalary / 26) * workingDays;
        const transportPart = (transportAllowance / 26) * workingDays;
        const mealPart = (mealAllowance / 26) * workingDays;
        const fixedPart = positionAllowance + healthAllowance;
        grossBeforePenalty = baseSalaryPart + transportPart + mealPart + fixedPart;

        const penaltyPer30Min = totalSalary * 0.01;
        const lateBlocks = agg.totalLateMinutes / 30;
        latePenalty = penaltyPer30Min * lateBlocks;
      }

      const loanInstallment = loanByEmployee.get(agg.employeeId) ?? 0;
      const adj = adjustmentMap.get(agg.employeeId) || {
        extraDeduction: 0,
        extraAddition: 0,
      };

      const baseGross = agg.isFullSalaryPayroll ? totalSalary : grossBeforePenalty;
      const baseNet = baseGross - latePenalty;
      const thp =
        baseNet - loanInstallment - adj.extraDeduction + adj.extraAddition;

      return {
        employeeId: agg.employeeId,
        totalSalary: Math.round(totalSalary),
        isFullSalaryPayroll: agg.isFullSalaryPayroll,
        scheduledWorkingDays: agg.scheduledWorkingDays,
        workingDays: agg.workingDays,
        offDays: agg.offDays,
        absentDays: agg.absentDays,
        lateCount: agg.lateCount,
        totalLateMinutes: agg.totalLateMinutes,
        totalWorkMinutes: agg.totalWorkMinutes,
        loanInstallment: Math.round(loanInstallment),
        baseSalary: Math.round(baseSalary),
        positionAllowance: Math.round(positionAllowance),
        transportAllowance: Math.round(transportAllowance),
        mealAllowance: Math.round(mealAllowance),
        healthAllowance: Math.round(healthAllowance),
        grossBeforePenalty: Math.round(grossBeforePenalty),
        latePenalty: Math.round(latePenalty),
        extraDeduction: Math.round(adj.extraDeduction),
        extraAddition: Math.round(adj.extraAddition),
        thp: Math.round(thp),
      };
    });

    const period = await prisma.$transaction(async (tx) => {
      const createdPeriod = await tx.payrollPeriod.create({
        data: {
          year,
          month,
          periodStart,
          periodEnd,
          items: {
            createMany: {
              data: itemsData,
            },
          },
        },
      });

      // Catat pembayaran pinjaman untuk periode ini dan update progress pinjaman
      const loanPaymentRows: {
        employeeLoanId: number;
        payrollPeriodId: number;
        amount: number;
      }[] = [];

      const loanUpdatePromises: Promise<unknown>[] = [];

      for (const loan of loans) {
        // Pastikan tidak melebihi jumlah bulan yang disepakati
        if (loan.paidMonths >= loan.months) continue;

        const newPaidMonths = Math.min(loan.months, loan.paidMonths + 1);

        loanPaymentRows.push({
          employeeLoanId: loan.id,
          payrollPeriodId: createdPeriod.id,
          amount: loan.installment,
        });

        loanUpdatePromises.push(
          tx.employeeLoan.update({
            where: { id: loan.id },
            data: {
              paidMonths: newPaidMonths,
              isActive: newPaidMonths >= loan.months ? false : true,
            },
          })
        );
      }

      if (loanPaymentRows.length > 0) {
        await tx.employeeLoanPayment.createMany({ data: loanPaymentRows });
      }
      if (loanUpdatePromises.length > 0) {
        await Promise.all(loanUpdatePromises);
      }

      return createdPeriod;
    });

    return NextResponse.json({
      message: "Payroll berhasil diproses dan dikunci untuk periode ini",
      periodId: period.id,
    });
  } catch (error: any) {
    console.error("Process payroll error", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Periode payroll ini sudah diproses" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
