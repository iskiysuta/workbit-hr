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

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: payload.employeeId },
      include: {
        shift: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get mobile leave requests error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

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

    const { date, shiftId, reason } = await request.json();

    if (!date || !shiftId) {
      return NextResponse.json(
        { message: "Tanggal dan shift wajib diisi" },
        { status: 400 }
      );
    }

    const dateObj = new Date(String(date) + "T00:00:00");
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: "Tanggal tidak valid" },
        { status: 400 }
      );
    }

    const shiftIdNum = Number(shiftId);
    if (Number.isNaN(shiftIdNum)) {
      return NextResponse.json(
        { message: "Shift tidak valid" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftIdNum } });
    if (!shift) {
      return NextResponse.json(
        { message: "Shift tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingPending = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: payload.employeeId,
        date: dateObj,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { message: "Sudah ada request untuk tanggal tersebut yang masih diproses" },
        { status: 400 }
      );
    }

    await prisma.leaveRequest.create({
      data: {
        employeeId: payload.employeeId,
        date: dateObj,
        shiftId: shiftIdNum,
        reason: reason ? String(reason) : null,
      },
    });

    return NextResponse.json({ message: "Request izin/sakit berhasil dikirim" });
  } catch (error) {
    console.error("Create mobile leave request error", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" });
  }
}
