import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Get employees error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      name,
      phone,
      email,
      password,
      joinedAt,
      position,
      level,
      address,
      bankName,
      bankAccount,
    } = body;

    if (!companyId || !name || !email || !password || !position || !level) {
      return NextResponse.json(
        {
          message:
            "ID perusahaan, nama, email, password, jabatan, dan level jabatan wajib diisi",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email karyawan sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Pastikan kombinasi level + jabatan ada di tabel Job
    const job = await prisma.job.findFirst({
      where: {
        level,
        title: position,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          message:
            "Jabatan dan level belum terdaftar di master jabatan. Harap tambahkan terlebih dahulu di menu Jabatan.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        name,
        phone,
        email,
        password: hashedPassword,
        joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
        position,
        level,
        address,
        bankName,
        bankAccount,
        jobId: job.id,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Create employee error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
