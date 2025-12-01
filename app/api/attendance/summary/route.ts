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
    const monthParam = searchParams.get("month"); // format: YYYY-MM

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
        employee: { select: { id: true, name: true, companyId: true } },
        shift: true,
        attendance: true,
      },
      orderBy: [{ employee: { name: "asc" } }],
    });

    type Summary = {
      employeeId: number;
      companyId: string;
      name: string;
      totalWorkingDays: number;
      totalOffDays: number;
      totalAbsentDays: number;
      totalWorkMinutes: number;
      totalLateMinutes: number;
    };

    const byEmployee = new Map<number, Summary>();

    for (const s of schedules) {
      const emp = s.employee;
      let summary = byEmployee.get(emp.id);
      if (!summary) {
        summary = {
          employeeId: emp.id,
          companyId: emp.companyId,
          name: emp.name,
          totalWorkingDays: 0,
          totalOffDays: 0,
          totalAbsentDays: 0,
          totalWorkMinutes: 0,
          totalLateMinutes: 0,
        };
        byEmployee.set(emp.id, summary);
      }

      const isDayOff = s.shift.isDayOff;
      if (isDayOff) {
        summary.totalOffDays += 1;
        continue;
      }

      summary.totalWorkingDays += 1;

      const timeInStr = formatTimeHHmm(s.attendance?.timeIn ?? null);
      const timeOutStr = formatTimeHHmm(s.attendance?.timeOut ?? null);

      if (!timeInStr) {
        // tidak hadir di hari kerja
        summary.totalAbsentDays += 1;
        continue;
      }

      const lateMinutes = calculateLatenessMinutes(
        s.shift.startTime,
        s.shift.endTime,
        timeInStr,
        s.shift.gracePeriodMinutes
      );

      const workMinutes = calculateWorkMinutes(timeInStr, timeOutStr);

      summary.totalLateMinutes += lateMinutes;
      summary.totalWorkMinutes += workMinutes;
    }

    const result = Array.from(byEmployee.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get attendance summary error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
