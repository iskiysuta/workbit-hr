import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmployeeToken } from "@/lib/mobileAuth";

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (!token) {
      return NextResponse.json(
        { message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const payload = verifyEmployeeToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Token tidak valid atau sudah kedaluwarsa" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const lat = body.lat as number | undefined;
    const lng = body.lng as number | undefined;

    const dbSetting = await prisma.attendanceLocationSetting.findFirst();

    const officeLat = dbSetting?.lat ??
      (process.env.OFFICE_LAT ? Number(process.env.OFFICE_LAT) : undefined);
    const officeLng = dbSetting?.lng ??
      (process.env.OFFICE_LNG ? Number(process.env.OFFICE_LNG) : undefined);
    const officeRadius = dbSetting?.radiusMeters ??
      (process.env.OFFICE_RADIUS_METERS
        ? Number(process.env.OFFICE_RADIUS_METERS)
        : undefined);

    if (
      typeof officeLat === "number" &&
      typeof officeLng === "number" &&
      typeof officeRadius === "number" &&
      Number.isFinite(officeLat) &&
      Number.isFinite(officeLng) &&
      Number.isFinite(officeRadius) &&
      officeRadius > 0
    ) {
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        return NextResponse.json(
          { message: "Lokasi (lat, lng) wajib dikirim untuk absen" },
          { status: 400 }
        );
      }

      const distance = haversineDistanceMeters(lat, lng, officeLat, officeLng);
      if (distance > officeRadius) {
        return NextResponse.json(
          { message: "Lokasi di luar area absen yang diizinkan" },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedule = await prisma.schedule.findFirst({
      where: {
        employeeId: payload.employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        shift: true,
        attendance: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { message: "Tidak ada jadwal untuk hari ini" },
        { status: 404 }
      );
    }

    if (schedule.shift.isDayOff) {
      return NextResponse.json(
        { message: "Hari ini adalah hari libur" },
        { status: 400 }
      );
    }

    if (schedule.attendance && schedule.attendance.timeIn) {
      return NextResponse.json(
        { message: "Anda sudah absen masuk" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: { scheduleId: schedule.id },
      create: {
        scheduleId: schedule.id,
        timeIn: now,
      },
      update: {
        timeIn: now,
      },
    });

    return NextResponse.json(
      {
        message: "Absen masuk berhasil",
        attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mobile clock-in error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
