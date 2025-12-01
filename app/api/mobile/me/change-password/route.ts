import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
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

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Password lama dan baru wajib diisi" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(oldPassword, employee.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Password lama tidak sesuai" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashed },
    });

    return NextResponse.json(
      { message: "Password berhasil diganti" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile change password error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
