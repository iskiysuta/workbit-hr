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
    const monthParam = url.searchParams.get("month"); // format: YYYY-MM

    let year: number;
    let month: number; // 1-12

    if (monthParam) {
      const [y, m] = monthParam.split("-").map((v) => Number(v));
      if (!y || !m || m < 1 || m > 12) {
        return NextResponse.json(
          { message: "Format parameter month tidak valid. Gunakan YYYY-MM" },
          { status: 400 }
        );
      }
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const schedules = await prisma.schedule.findMany({
      where: {
        employeeId: payload.employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shift: true,
        attendance: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const items = schedules
      .filter((s) => s.attendance)
      .map((s) => ({
        id: s.id,
        date: s.date,
        shift: {
          id: s.shiftId,
          name: s.shift.name,
          startTime: s.shift.startTime,
          endTime: s.shift.endTime,
          gracePeriodMinutes: s.shift.gracePeriodMinutes,
          isDayOff: s.shift.isDayOff,
        },
        attendance: s.attendance
          ? {
              timeIn: s.attendance.timeIn,
              timeOut: s.attendance.timeOut,
            }
          : null,
      }));

    return NextResponse.json({
      year,
      month,
      items,
    });
  } catch (error) {
    console.error("Get mobile attendance history error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
