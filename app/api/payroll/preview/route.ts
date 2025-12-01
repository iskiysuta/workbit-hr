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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // YYYY-MM

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
      orderBy: [{ employee: { name: "asc" } }],
    });

    const loans = await prisma.employeeLoan.findMany({
      where: { isActive: true },
      select: { employeeId: true, installment: true },
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

      // hadir
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

    // Pastikan semua karyawan (terutama yang full salary) ikut muncul di payroll,
    // meskipun tidak punya jadwal di periode ini.
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

    // Build response rows
    const rows = Array.from(aggByEmployee.values()).map((agg) => {
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

        // Potongan keterlambatan: 1% dari total gaji per 30 menit terlambat
        const penaltyPer30Min = totalSalary * 0.01;
        const lateBlocks = agg.totalLateMinutes / 30;
        latePenalty = penaltyPer30Min * lateBlocks;
      }

      const loanInstallment = loanByEmployee.get(agg.employeeId) ?? 0;

      return {
        employeeId: agg.employeeId,
        companyId: agg.companyId,
        name: agg.name,
        jobLevel: agg.jobLevel,
        jobTitle: agg.jobTitle,
        totalSalary,
        isFullSalaryPayroll: agg.isFullSalaryPayroll,
        scheduledWorkingDays: agg.scheduledWorkingDays,
        workingDays,
        offDays: agg.offDays,
        absentDays: agg.absentDays,
        lateCount: agg.lateCount,
        totalLateMinutes: agg.totalLateMinutes,
        totalWorkMinutes: agg.totalWorkMinutes,
        loanInstallment,
        baseSalary,
        positionAllowance,
        transportAllowance,
        mealAllowance,
        healthAllowance,
        grossBeforePenalty,
        latePenalty,
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get payroll preview error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
