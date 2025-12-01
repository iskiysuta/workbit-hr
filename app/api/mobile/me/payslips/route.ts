import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmployeeToken } from "@/lib/mobileAuth";

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");

    let yearFilter: number | undefined;
    if (yearParam) {
      const y = Number(yearParam);
      if (!y) {
        return NextResponse.json(
          { message: "Format parameter year tidak valid" },
          { status: 400 }
        );
      }
      yearFilter = y;
    }

    const items = await prisma.payrollItem.findMany({
      where: {
        employeeId: payload.employeeId,
        ...(yearFilter
          ? {
              payrollPeriod: {
                year: yearFilter,
              },
            }
          : {}),
      },
      include: {
        payrollPeriod: true,
      },
      orderBy: [
        { payrollPeriod: { year: "desc" } },
        { payrollPeriod: { month: "desc" } },
      ],
    });

    const payslips = items.map((item) => ({
      periodId: item.payrollPeriodId,
      year: item.payrollPeriod.year,
      month: item.payrollPeriod.month,
      periodStart: item.payrollPeriod.periodStart,
      periodEnd: item.payrollPeriod.periodEnd,
      processedAt: item.payrollPeriod.createdAt,
      thp: item.thp,
    }));

    return NextResponse.json({ payslips });
  } catch (error) {
    console.error("Get mobile payslips error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
