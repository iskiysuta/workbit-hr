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

    const requests = await prisma.shiftSwapRequest.findMany({
      where: {
        OR: [
          { requesterId: payload.employeeId },
          { targetId: payload.employeeId },
        ],
      },
      include: {
        requester: { select: { id: true, name: true, companyId: true } },
        target: { select: { id: true, name: true, companyId: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get mobile shift swap requests error", error);
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

    const { date, targetEmployeeId } = await request.json();

    if (!date || !targetEmployeeId) {
      return NextResponse.json(
        { message: "Tanggal dan karyawan tujuan wajib diisi" },
        { status: 400 }
      );
    }

    const targetIdNum = Number(targetEmployeeId);
    if (Number.isNaN(targetIdNum)) {
      return NextResponse.json(
        { message: "Karyawan tujuan tidak valid" },
        { status: 400 }
      );
    }

    if (targetIdNum === payload.employeeId) {
      return NextResponse.json(
        { message: "Tidak bisa tukar shift dengan diri sendiri" },
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

    // Pastikan kedua karyawan ada
    const [requester, target] = await Promise.all([
      prisma.employee.findUnique({ where: { id: payload.employeeId } }),
      prisma.employee.findUnique({ where: { id: targetIdNum } }),
    ]);

    if (!requester || !target) {
      return NextResponse.json(
        { message: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cegah duplikat request PENDING untuk requester+date yang sama
    const existing = await prisma.shiftSwapRequest.findFirst({
      where: {
        requesterId: payload.employeeId,
        date: dateObj,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Sudah ada request tukar shift untuk tanggal tersebut" },
        { status: 400 }
      );
    }

    await prisma.shiftSwapRequest.create({
      data: {
        requesterId: payload.employeeId,
        targetId: targetIdNum,
        date: dateObj,
      },
    });

    return NextResponse.json({ message: "Request tukar shift berhasil dikirim" });
  } catch (error) {
    console.error("Create mobile shift swap request error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
