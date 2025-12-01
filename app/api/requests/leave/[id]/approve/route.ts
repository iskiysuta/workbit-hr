import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "ID request tidak valid" },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: idNum },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { message: "Request tidak ditemukan" },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "Request sudah diproses" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update / buat jadwal sesuai request
      await tx.schedule.upsert({
        where: {
          employeeId_date: {
            employeeId: leaveRequest.employeeId,
            date: leaveRequest.date,
          },
        },
        create: {
          employeeId: leaveRequest.employeeId,
          date: leaveRequest.date,
          shiftId: leaveRequest.shiftId,
        },
        update: {
          shiftId: leaveRequest.shiftId,
        },
      });

      const updated = await tx.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Approve leave request error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
