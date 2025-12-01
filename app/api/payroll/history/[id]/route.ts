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
        { message: "ID periode tidak valid" },
        { status: 400 }
      );
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: { select: { id: true, name: true, companyId: true } },
          },
          orderBy: { employee: { name: "asc" } },
        },
      },
    });

    if (!period) {
      return NextResponse.json(
        { message: "Periode payroll tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(period);
  } catch (error) {
    console.error("Get payroll period detail error", error);
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
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: "ID periode tidak valid" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Ambil semua pembayaran pinjaman yang terkait periode ini
      const payments = await tx.employeeLoanPayment.findMany({
        where: { payrollPeriodId: id },
        select: { employeeLoanId: true },
      });

      if (payments.length > 0) {
        const countByLoan = new Map<number, number>();
        for (const p of payments) {
          countByLoan.set(
            p.employeeLoanId,
            (countByLoan.get(p.employeeLoanId) ?? 0) + 1
          );
        }

        for (const [loanId, count] of countByLoan.entries()) {
          await tx.employeeLoan.update({
            where: { id: loanId },
            data: {
              paidMonths: {
                decrement: count,
              },
              isActive: true,
            },
          });
        }

        await tx.employeeLoanPayment.deleteMany({
          where: { payrollPeriodId: id },
        });
      }

      await tx.payrollItem.deleteMany({ where: { payrollPeriodId: id } });
      await tx.payrollPeriod.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Periode payroll dihapus (unlock)" });
  } catch (error) {
    console.error("Delete payroll period error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
