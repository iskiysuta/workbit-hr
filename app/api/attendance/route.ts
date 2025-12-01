import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateOnly(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildDateWithTime(base: Date, time: string) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTimeHHmm(date: Date | null | undefined) {
  if (!date) return null;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const employeeIdParam = searchParams.get("employeeId");

    if (!dateParam) {
      return NextResponse.json(
        { message: "Tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const baseDate = parseDateOnly(dateParam);
    if (!baseDate) {
      return NextResponse.json(
        { message: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const where: any = {
      date: {
        gte: baseDate,
        lt: nextDate,
      },
    };

    if (employeeIdParam) {
      const empId = Number(employeeIdParam);
      if (!Number.isNaN(empId)) {
        where.employeeId = empId;
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, companyId: true } },
        shift: true,
        attendance: true,
      },
      orderBy: [
        { employee: { name: "asc" } },
        { date: "asc" },
      ],
    });

    const rows = schedules.map((s) => ({
      scheduleId: s.id,
      date: s.date,
      employee: s.employee,
      shift: {
        id: s.shift.id,
        name: s.shift.name,
        startTime: s.shift.startTime,
        endTime: s.shift.endTime,
        gracePeriodMinutes: s.shift.gracePeriodMinutes,
        isDayOff: s.shift.isDayOff,
      },
      attendance: {
        timeIn: formatTimeHHmm(s.attendance?.timeIn ?? null),
        timeOut: formatTimeHHmm(s.attendance?.timeOut ?? null),
      },
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get attendance error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scheduleId, timeIn, timeOut } = await request.json();

    if (!scheduleId) {
      return NextResponse.json(
        { message: "scheduleId wajib diisi" },
        { status: 400 }
      );
    }

    const id = Number(scheduleId);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: "scheduleId tidak valid" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { message: "Schedule tidak ditemukan" },
        { status: 404 }
      );
    }

    let timeInDate: Date | null = null;
    let timeOutDate: Date | null = null;

    if (timeIn) {
      timeInDate = buildDateWithTime(schedule.date, timeIn);
      if (!timeInDate) {
        return NextResponse.json(
          { message: "Format jam masuk tidak valid" },
          { status: 400 }
        );
      }
    }

    if (timeOut) {
      timeOutDate = buildDateWithTime(schedule.date, timeOut);
      if (!timeOutDate) {
        return NextResponse.json(
          { message: "Format jam keluar tidak valid" },
          { status: 400 }
        );
      }
    }

    const attendance = await prisma.attendance.upsert({
      where: { scheduleId: id },
      create: {
        scheduleId: id,
        timeIn: timeInDate,
        timeOut: timeOutDate,
      },
      update: {
        timeIn: timeInDate,
        timeOut: timeOutDate,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Save attendance error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleIdParam = searchParams.get("scheduleId");

    if (!scheduleIdParam) {
      return NextResponse.json(
        { message: "scheduleId wajib diisi" },
        { status: 400 }
      );
    }

    const scheduleId = Number(scheduleIdParam);
    if (Number.isNaN(scheduleId)) {
      return NextResponse.json(
        { message: "scheduleId tidak valid" },
        { status: 400 }
      );
    }

    await prisma.attendance.deleteMany({
      where: { scheduleId },
    });

    return NextResponse.json({ message: "Data absensi dihapus" });
  } catch (error) {
    console.error("Delete attendance error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
