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

    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
    });

    if (!employee) {
      return NextResponse.json({ message: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    const { password: _password, ...safeEmployee } = employee;

    return NextResponse.json({ employee: safeEmployee });
  } catch (error) {
    console.error("Get mobile employee profile error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
