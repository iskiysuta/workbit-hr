import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const periods = await prisma.payrollPeriod.findMany({
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const result = periods.map((p) => ({
      id: p.id,
      year: p.year,
      month: p.month,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      createdAt: p.createdAt,
      itemCount: p._count.items,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get payroll history error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
