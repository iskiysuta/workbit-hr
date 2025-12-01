import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmployeeToken } from "@/lib/mobileAuth";

type ParamsPromise = Promise<{
  id: string;
}>;

export async function GET(
  request: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (!token) {
      return NextResponse.json(
        { message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const payload = verifyEmployeeToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Token tidak valid atau sudah kedaluwarsa" },
        { status: 401 }
      );
    }

    const { id: idParam } = await context.params;
    const periodId = Number(idParam);

    if (Number.isNaN(periodId)) {
      return NextResponse.json(
        { message: "ID periode tidak valid" },
        { status: 400 }
      );
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        items: {
          where: { employeeId: payload.employeeId },
        },
      },
    });

    if (!period || period.items.length === 0) {
      return NextResponse.json(
        { message: "Slip gaji tidak ditemukan" },
        { status: 404 }
      );
    }

    const item = period.items[0];

    const slip = {
      payrollItemId: item.id,
      totalSalary: item.totalSalary,
      isFullSalaryPayroll: item.isFullSalaryPayroll,
      scheduledWorkingDays: item.scheduledWorkingDays,
      workingDays: item.workingDays,
      offDays: item.offDays,
      absentDays: item.absentDays,
      lateCount: item.lateCount,
      totalLateMinutes: item.totalLateMinutes,
      totalWorkMinutes: item.totalWorkMinutes,
      loanInstallment: item.loanInstallment,
      baseSalary: item.baseSalary,
      positionAllowance: item.positionAllowance,
      transportAllowance: item.transportAllowance,
      mealAllowance: item.mealAllowance,
      healthAllowance: item.healthAllowance,
      grossBeforePenalty: item.grossBeforePenalty,
      latePenalty: item.latePenalty,
      extraDeduction: item.extraDeduction,
      extraAddition: item.extraAddition,
      thp: item.thp,
    };

    return NextResponse.json({
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        processedAt: period.createdAt,
      },
      slip,
    });
  } catch (error) {
    console.error("Get mobile payslip detail error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
