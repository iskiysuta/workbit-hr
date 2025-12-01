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

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Reject leave request error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
