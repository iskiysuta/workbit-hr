import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Get shifts error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime: finalStart ?? "",
        endTime: finalEnd ?? "",
        gracePeriodMinutes: grace,
        isDayOff: Boolean(isDayOff),
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Create shift error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
