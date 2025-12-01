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

    const schedule = await prisma.schedule.findFirst({
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

    if (!schedule) {
      return NextResponse.json(
        { message: "Tidak ada jadwal untuk hari ini" },
        { status: 404 }
      );
    }

    if (!schedule.attendance || !schedule.attendance.timeIn) {
      return NextResponse.json(
        { message: "Anda belum absen masuk" },
        { status: 400 }
      );
    }

    if (schedule.attendance.timeOut) {
      return NextResponse.json(
        { message: "Anda sudah absen keluar" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { scheduleId: schedule.id },
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
