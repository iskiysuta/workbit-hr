import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get("employeeId");

    const where: any = {};
    if (employeeIdParam) {
      const empId = Number(employeeIdParam);
      if (!Number.isNaN(empId)) {
        where.employeeId = empId;
      }
    }

    const loans = await prisma.employeeLoan.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, companyId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("Get employee loans error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, loanDate, amount, months, installment, description } =
      await request.json();

    if (!employeeId || !loanDate || amount == null || months == null) {
      return NextResponse.json(
        { message: "Karyawan, tanggal, jumlah pinjaman, dan jumlah bulan wajib diisi" },
        { status: 400 }
      );
    }

    const empId = Number(employeeId);
    const amountNumber = Number(amount);
    const monthsNumber = Number(months);
    const installmentNumber =
      installment == null ? Math.floor(amountNumber / monthsNumber) : Number(installment);

    if (
      Number.isNaN(empId) ||
      Number.isNaN(amountNumber) ||
      Number.isNaN(monthsNumber) ||
      Number.isNaN(installmentNumber) ||
      amountNumber <= 0 ||
      monthsNumber <= 0 ||
      installmentNumber <= 0
    ) {
      return NextResponse.json(
        { message: "Nilai pinjaman / bulan / cicilan tidak valid" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { id: empId } });
    if (!employee) {
      return NextResponse.json(
        { message: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    const dateObj = new Date(loanDate + "T00:00:00");
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: "Tanggal peminjaman tidak valid" },
        { status: 400 }
      );
    }

    const loan = await prisma.employeeLoan.create({
      data: {
        employeeId: empId,
        loanDate: dateObj,
        amount: amountNumber,
        months: monthsNumber,
        installment: installmentNumber,
        description: description ?? null,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Create employee loan error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
