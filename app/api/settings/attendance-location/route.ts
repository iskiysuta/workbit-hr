import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.attendanceLocationSetting.findFirst();

    if (!setting) {
      const envLat = process.env.OFFICE_LAT;
      const envLng = process.env.OFFICE_LNG;
      const envRadius = process.env.OFFICE_RADIUS_METERS;

      if (envLat && envLng && envRadius) {
        return NextResponse.json({
          lat: Number(envLat),
          lng: Number(envLng),
          radiusMeters: Number(envRadius),
          source: "env",
        });
      }

      return NextResponse.json(null);
    }

    return NextResponse.json({
      lat: setting.lat,
      lng: setting.lng,
      radiusMeters: setting.radiusMeters,
      source: "db",
    });
  } catch (error) {
    console.error("Get attendance location setting error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { lat, lng, radiusMeters } = body as {
      lat?: number;
      lng?: number;
      radiusMeters?: number;
    };

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof radiusMeters !== "number" ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      Number.isNaN(radiusMeters) ||
      radiusMeters <= 0
    ) {
      return NextResponse.json(
        { message: "lat, lng, dan radiusMeters wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const setting = await prisma.attendanceLocationSetting.upsert({
      where: { id: 1 },
      update: { lat, lng, radiusMeters },
      create: { id: 1, lat, lng, radiusMeters },
    });

    return NextResponse.json({
      message: "Pengaturan lokasi absensi berhasil disimpan",
      setting,
    });
  } catch (error) {
    console.error("Save attendance location setting error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
