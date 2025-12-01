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
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ message: "Karyawan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch (error) {
    console.error("Get employee error", error);
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
    const body = await request.json();
    const {
      companyId,
      name,
      phone,
      email,
      joinedAt,
      position,
      level,
      address,
      bankName,
      bankAccount,
    } = body;

    if (!companyId || !name || !email || !position || !level) {
      return NextResponse.json(
        {
          message:
            "ID perusahaan, nama, email, jabatan, dan level jabatan wajib diisi",
        },
        { status: 400 }
      );
    }

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

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        companyId,
        name,
        phone,
        email,
        joinedAt: joinedAt ? new Date(joinedAt) : undefined,
        position,
        level,
        address,
        bankName,
        bankAccount,
        jobId: job.id,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Update employee error", error);
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
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Karyawan berhasil dihapus" });
  } catch (error) {
    console.error("Delete employee error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
