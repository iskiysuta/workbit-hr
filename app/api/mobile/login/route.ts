import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signEmployeeToken } from "@/lib/mobileAuth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { email } });

    if (!employee) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, employee.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const { password: _password, ...safeEmployee } = employee;

    const token = signEmployeeToken(employee.id, employee.email);

    return NextResponse.json(
      {
        message: "Login berhasil",
        token,
        employee: safeEmployee,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile employee login error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
