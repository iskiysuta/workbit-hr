import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Get jobs error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { level, title, totalSalary, isFullSalaryPayroll } =
      await request.json();

    if (!level || !title || totalSalary == null) {
      return NextResponse.json(
        { message: "Level, jabatan, dan total gaji wajib diisi" },
        { status: 400 }
      );
    }

    const salaryNumber = Number(totalSalary);
    if (Number.isNaN(salaryNumber) || salaryNumber < 0) {
      return NextResponse.json(
        { message: "Total gaji tidak valid" },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        level,
        title,
        totalSalary: salaryNumber,
        isFullSalaryPayroll: Boolean(isFullSalaryPayroll),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Create job error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
