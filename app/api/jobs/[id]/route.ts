import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = Promise<{
  id: string;
}>;

export async function GET(_req: NextRequest, context: { params: ParamsPromise }) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

  try {
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ message: "Jabatan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (error) {
    console.error("Get job error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: ParamsPromise }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

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

    const job = await prisma.job.update({
      where: { id },
      data: {
        level,
        title,
        totalSalary: salaryNumber,
        isFullSalaryPayroll: Boolean(isFullSalaryPayroll),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Update job error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: ParamsPromise }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ message: "Jabatan berhasil dihapus" });
  } catch (error) {
    console.error("Delete job error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
