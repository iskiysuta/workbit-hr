import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

function parseScheduleDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const parts = value.split(/[\/-]/);
  if (parts.length === 3) {
    const [p1, p2, p3] = parts.map((p) => p.trim());

    // DD/MM/YYYY atau DD-MM-YYYY
    if (p1.length === 2 && p2.length === 2 && p3.length === 4) {
      const day = Number(p1);
      const month = Number(p2);
      const year = Number(p3);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }

    // YYYY-MM-DD atau YYYY/MM/DD
    if (p1.length === 4 && p2.length === 2 && p3.length === 2) {
      const year = Number(p1);
      const month = Number(p2);
      const day = Number(p3);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { message: "File XLSX tidak ditemukan" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "File XLSX kosong" },
        { status: 400 }
      );
    }

    type ParsedRow = {
      companyId: string;
      dateRaw: string;
      shiftName: string;
    };

    const parsed: ParsedRow[] = [];

    for (const row of rows) {
      const companyId = String(
        row.companyId || row["ID Perusahaan"] || ""
      ).trim();
      const dateRaw = String(row.date || row["Tanggal"] || "").trim();
      const shiftName = String(row.shiftName || row["Nama Shift"] || "").trim();

      if (!companyId && !dateRaw && !shiftName) {
        continue;
      }

      if (!companyId || !dateRaw || !shiftName) {
        return NextResponse.json(
          {
            message:
              "Setiap baris wajib memiliki ID Perusahaan, Tanggal, dan Nama Shift",
          },
          { status: 400 }
        );
      }

      parsed.push({ companyId, dateRaw, shiftName });
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada baris data yang valid di file" },
        { status: 400 }
      );
    }

    const companyIds = Array.from(new Set(parsed.map((p) => p.companyId)));
    const shiftNames = Array.from(new Set(parsed.map((p) => p.shiftName)));

    const employees = await prisma.employee.findMany({
      where: { companyId: { in: companyIds } },
      select: { id: true, companyId: true },
    });

    const shifts = await prisma.shift.findMany({
      where: { name: { in: shiftNames } },
      select: { id: true, name: true },
    });

    const employeeMap = new Map(employees.map((e) => [e.companyId, e.id]));
    const shiftMap = new Map(shifts.map((s) => [s.name, s.id]));

    const missingEmployees = companyIds.filter((cid) => !employeeMap.has(cid));
    const missingShifts = shiftNames.filter((sn) => !shiftMap.has(sn));

    if (missingEmployees.length || missingShifts.length) {
      return NextResponse.json(
        {
          message: "Beberapa karyawan atau shift belum terdaftar",
          missingEmployees,
          missingShifts,
        },
        { status: 400 }
      );
    }

    for (const row of parsed) {
      const employeeId = employeeMap.get(row.companyId)!;
      const shiftId = shiftMap.get(row.shiftName)!;
      const date = parseScheduleDate(row.dateRaw);
      if (!date) {
        return NextResponse.json(
          { message: `Format tanggal tidak valid: ${row.dateRaw}` },
          { status: 400 }
        );
      }

      await prisma.schedule.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date,
          },
        },
        create: {
          employeeId,
          date,
          shiftId,
        },
        update: {
          shiftId,
        },
      });
    }

    return NextResponse.json({ message: "Import jadwal berhasil" });
  } catch (error) {
    console.error("Import schedules error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
