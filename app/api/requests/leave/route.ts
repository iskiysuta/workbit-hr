import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");

    const where: any = {};
    if (statusParam) {
      where.status = statusParam as any;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, companyId: true } },
        shift: true,
      },
      orderBy: [{ status: "asc" }, { date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get leave requests error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
