import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = Promise<{
  id: string;
}>;

export async function GET(
  _req: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID pinjaman tidak valid" },
        { status: 400 }
      );
    }

    const loan = await prisma.employeeLoan.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, companyId: true } },
        payments: {
          include: {
            payrollPeriod: {
              select: {
                id: true,
                year: true,
                month: true,
                periodStart: true,
                periodEnd: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!loan) {
      return NextResponse.json(
        { message: "Pinjaman tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error("Get employee loan detail error", error);
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
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID pinjaman tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data: any = {};

    if (body.employeeId != null) {
      const empId = Number(body.employeeId);
      if (Number.isNaN(empId)) {
        return NextResponse.json(
          { message: "ID karyawan tidak valid" },
          { status: 400 }
        );
      }
      data.employeeId = empId;
    }

    if (body.loanDate) {
      const d = new Date(body.loanDate + "T00:00:00");
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "Tanggal peminjaman tidak valid" },
          { status: 400 }
        );
      }
      data.loanDate = d;
    }

    if (body.amount != null) {
      const v = Number(body.amount);
      if (Number.isNaN(v) || v <= 0) {
        return NextResponse.json(
          { message: "Jumlah pinjaman tidak valid" },
          { status: 400 }
        );
      }
      data.amount = v;
    }

    if (body.months != null) {
      const v = Number(body.months);
      if (Number.isNaN(v) || v <= 0) {
        return NextResponse.json(
          { message: "Jumlah bulan tidak valid" },
          { status: 400 }
        );
      }
      data.months = v;
    }

    if (body.installment != null) {
      const v = Number(body.installment);
      if (Number.isNaN(v) || v <= 0) {
        return NextResponse.json(
          { message: "Jumlah cicilan tidak valid" },
          { status: 400 }
        );
      }
      data.installment = v;
    }

    if (body.description !== undefined) {
      data.description = body.description || null;
    }

    if (body.isActive != null) {
      data.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.employeeLoan.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update employee loan error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID pinjaman tidak valid" },
        { status: 400 }
      );
    }

    await prisma.employeeLoan.delete({ where: { id } });

    return NextResponse.json({ message: "Pinjaman dihapus" });
  } catch (error) {
    console.error("Delete employee loan error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
