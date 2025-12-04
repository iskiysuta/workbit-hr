import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmployeeToken } from "@/lib/mobileAuth";

export async function POST(request: NextRequest) {
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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    function isOvernightShift(shift: { startTime: string | null; endTime: string | null }) {
      if (!shift?.startTime || !shift?.endTime) return false;
      // format HH:mm, jadi perbandingan string sudah cukup
      return shift.endTime <= shift.startTime;
    }

    const scheduleToday = await prisma.schedule.findFirst({
      where: {
        employeeId: payload.employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        shift: true,
        attendance: true,
      },
    });

    let targetSchedule = scheduleToday;

    const canClockOutToday =
      scheduleToday &&
      scheduleToday.attendance &&
      scheduleToday.attendance.timeIn &&
      !scheduleToday.attendance.timeOut;

    if (!canClockOutToday) {
      const scheduleYesterday = await prisma.schedule.findFirst({
        where: {
          employeeId: payload.employeeId,
          date: {
            gte: yesterday,
            lt: today,
          },
        },
        include: {
          shift: true,
          attendance: true,
        },
      });

      if (
        scheduleYesterday &&
        !scheduleYesterday.shift.isDayOff &&
        scheduleYesterday.attendance &&
        scheduleYesterday.attendance.timeIn &&
        !scheduleYesterday.attendance.timeOut &&
        isOvernightShift(scheduleYesterday.shift)
      ) {
        targetSchedule = scheduleYesterday;
      }
    }

    if (!targetSchedule) {
      return NextResponse.json(
        { message: "Tidak ada jadwal untuk hari ini" },
        { status: 404 }
      );
    }

    if (!targetSchedule.attendance || !targetSchedule.attendance.timeIn) {
      return NextResponse.json(
        { message: "Anda belum absen masuk" },
        { status: 400 }
      );
    }

    if (targetSchedule.attendance.timeOut) {
      return NextResponse.json(
        { message: "Anda sudah absen keluar" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { scheduleId: targetSchedule.id },
      data: {
        timeOut: now,
      },
    });

    return NextResponse.json(
      {
        message: "Absen keluar berhasil",
        attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile clock-out error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
