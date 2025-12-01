import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsPromise = Promise<{
  id: string;
}>;

export async function PATCH(
  req: NextRequest,
  context: { params: ParamsPromise }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
  }

  try {
    const { employeeId, date, shiftId } = await req.json();

    if (!employeeId || !date || !shiftId) {
      return NextResponse.json(
        { message: "Employee, tanggal, dan shift wajib diisi" },
        { status: 400 }
      );
    }

    const empIdNum = Number(employeeId);
    const shiftIdNum = Number(shiftId);
    if (Number.isNaN(empIdNum) || Number.isNaN(shiftIdNum)) {
      return NextResponse.json(
        { message: "ID employee atau shift tidak valid" },
        { status: 400 }
      );
    }

    const dateObj = new Date(String(date) + "T00:00:00");
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: "Tanggal tidak valid" },
        { status: 400 }
      );
    }

    // Cek apakah kombinasi employee+date sudah dipakai jadwal lain
    const existing = await prisma.schedule.findFirst({
      where: {
        employeeId: empIdNum,
        date: dateObj,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Sudah ada jadwal untuk karyawan dan tanggal tersebut" },
        { status: 400 }
      );
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        employeeId: empIdNum,
        date: dateObj,
        shiftId: shiftIdNum,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update schedule error", error);
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
    await prisma.schedule.delete({ where: { id } });
    return NextResponse.json({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    console.error("Delete schedule error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
