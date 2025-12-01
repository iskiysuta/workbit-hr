import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get("employeeId");
    const monthParam = searchParams.get("month"); // format YYYY-MM
    const startDateParam = searchParams.get("startDate"); // format YYYY-MM-DD
    const endDateParam = searchParams.get("endDate"); // format YYYY-MM-DD

    const where: any = {};

    if (employeeIdParam) {
      const employeeId = Number(employeeIdParam);
      if (!Number.isNaN(employeeId)) {
        where.employeeId = employeeId;
      }
    }

    if (startDateParam || endDateParam) {
      const dateFilter: any = {};

      if (startDateParam) {
        const start = new Date(startDateParam + "T00:00:00");
        if (!Number.isNaN(start.getTime())) {
          dateFilter.gte = start;
        }
      }

      if (endDateParam) {
        const end = new Date(endDateParam + "T23:59:59.999");
        if (!Number.isNaN(end.getTime())) {
          dateFilter.lte = end;
        }
      }

      if (Object.keys(dateFilter).length > 0) {
        where.date = dateFilter;
      }
    } else if (monthParam) {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        where.date = {
          gte: start,
          lt: end,
        };
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, companyId: true },
        },
        shift: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Get schedules error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, date, shiftId } = await request.json();

    if (!employeeId || !date || !shiftId) {
      return NextResponse.json(
        { message: "Employee, tanggal, dan shift wajib diisi" },
        { status: 400 }
      );
    }

    const empIdNum = Number(employeeId);
    const shiftIdNum = Number(shiftId);
    if (Number.isNaN(empIdNum) || Number.isNaN(shiftIdNum)) {
      return NextResponse.json(
        { message: "ID employee atau shift tidak valid" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date + "T00:00:00");
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: "Tanggal tidak valid" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.upsert({
      where: {
        employeeId_date: {
          employeeId: empIdNum,
          date: dateObj,
        },
      },
      create: {
        employeeId: empIdNum,
        date: dateObj,
        shiftId: shiftIdNum,
      },
      update: {
        shiftId: shiftIdNum,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Create schedule error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
