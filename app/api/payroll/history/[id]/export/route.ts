import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type ParamsPromise = Promise<{
  id: string;
}>;

export async function GET(_req: NextRequest, context: { params: ParamsPromise }) {
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
          include: { employee: { select: { companyId: true, name: true } } },
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

    const headers = [
      "ID Perusahaan",
      "Nama",
      "HK",
      "Jadwal Kerja",
      "Libur",
      "Tidak Masuk",
      "Terlambat (kali)",
      "Total Menit Terlambat",
      "Total Gaji",
      "Pinjaman",
      "Potongan Telat",
      "Potongan Lain",
      "Tambahan",
      "THP",
    ];

    const rows = period.items.map((item) => ({
      "ID Perusahaan": item.employee.companyId,
      Nama: item.employee.name,
      HK: item.workingDays,
      "Jadwal Kerja": item.scheduledWorkingDays,
      Libur: item.offDays,
      "Tidak Masuk": item.absentDays,
      "Terlambat (kali)": item.lateCount,
      "Total Menit Terlambat": item.totalLateMinutes,
      "Total Gaji": item.totalSalary,
      Pinjaman: item.loanInstallment,
      "Potongan Telat": item.latePenalty,
      "Potongan Lain": item.extraDeduction,
      Tambahan: item.extraAddition,
      THP: item.thp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const ym = `${period.month.toString().padStart(2, "0")}-${period.year}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="payroll-${ym}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export payroll history error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
