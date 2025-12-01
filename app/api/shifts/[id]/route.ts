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
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return NextResponse.json({ message: "Shift tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(shift);
  } catch (error) {
    console.error("Get shift error", error);
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
    const { name, startTime, endTime, gracePeriodMinutes, isDayOff } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Nama shift wajib diisi" },
        { status: 400 }
      );
    }

    let finalStart = startTime as string | undefined;
    let finalEnd = endTime as string | undefined;
    let grace = Number(gracePeriodMinutes ?? 0);

    if (isDayOff) {
      finalStart = "";
      finalEnd = "";
      grace = 0;
    } else {
      if (!finalStart || !finalEnd) {
        return NextResponse.json(
          { message: "Jam masuk dan jam keluar wajib diisi" },
          { status: 400 }
        );
      }

      if (Number.isNaN(grace) || grace < 0) {
        return NextResponse.json(
          { message: "Grace period tidak valid" },
          { status: 400 }
        );
      }
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name,
        startTime: finalStart ?? "",
        endTime: finalEnd ?? "",
        gracePeriodMinutes: grace,
        isDayOff: Boolean(isDayOff),
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Update shift error", error);
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
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ message: "Shift berhasil dihapus" });
  } catch (error) {
    console.error("Delete shift error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
