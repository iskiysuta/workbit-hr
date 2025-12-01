import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

function parseAttendanceDate(raw: string | undefined): Date | null {
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

function parseTimeHHmm(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const [hStr, mStr] = value.split(":");
  if (!hStr || !mStr) return null;
  const h = Number(hStr);
  const m = Number(mStr);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
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
      timeInRaw: string;
      timeOutRaw: string;
    };

    const parsed: ParsedRow[] = [];

    for (const row of rows) {
      const companyId = String(
        row.companyId || row["ID Perusahaan"] || ""
      ).trim();
      const dateRaw = String(row.date || row["Tanggal"] || "").trim();
      const timeInRaw = String(row.timeIn || row["Jam Masuk"] || "").trim();
      const timeOutRaw = String(row.timeOut || row["Jam Keluar"] || "").trim();

      if (!companyId && !dateRaw && !timeInRaw && !timeOutRaw) {
        continue;
      }

      if (!companyId || !dateRaw) {
        return NextResponse.json(
          {
            message:
              "Setiap baris wajib memiliki ID Perusahaan dan Tanggal (Jam Masuk/Keluar opsional)",
          },
          { status: 400 }
        );
      }

      parsed.push({ companyId, dateRaw, timeInRaw, timeOutRaw });
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada baris data yang valid di file" },
        { status: 400 }
      );
    }

    const companyIds = Array.from(new Set(parsed.map((p) => p.companyId)));

    const employees = await prisma.employee.findMany({
      where: { companyId: { in: companyIds } },
      select: { id: true, companyId: true },
    });

    const employeeMap = new Map(employees.map((e) => [e.companyId, e.id]));

    const missingEmployees = companyIds.filter((cid) => !employeeMap.has(cid));

    if (missingEmployees.length) {
      return NextResponse.json(
        {
          message: "Beberapa karyawan belum terdaftar",
          missingEmployees,
        },
        { status: 400 }
      );
    }

    type ReadyRow = {
      scheduleId: number;
      scheduleDate: Date;
      timeInRaw: string;
      timeOutRaw: string;
    };

    const ready: ReadyRow[] = [];
    const missingSchedules: string[] = [];

    for (const row of parsed) {
      const employeeId = employeeMap.get(row.companyId)!;
      const date = parseAttendanceDate(row.dateRaw);
      if (!date) {
        return NextResponse.json(
          { message: `Format tanggal tidak valid: ${row.dateRaw}` },
          { status: 400 }
        );
      }

      const schedule = await prisma.schedule.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date,
          },
        },
        select: { id: true, date: true },
      });

      if (!schedule) {
        missingSchedules.push(`${row.companyId} - ${row.dateRaw}`);
        continue;
      }

      ready.push({
        scheduleId: schedule.id,
        scheduleDate: schedule.date,
        timeInRaw: row.timeInRaw,
        timeOutRaw: row.timeOutRaw,
      });
    }

    if (missingSchedules.length) {
      return NextResponse.json(
        {
          message:
            "Beberapa jadwal belum ada (cek modul Jadwal untuk kombinasi ID Perusahaan + Tanggal ini)",
          missingSchedules,
        },
        { status: 400 }
      );
    }

    for (const row of ready) {
      const timeIn = parseTimeHHmm(row.timeInRaw || undefined);
      const timeOut = parseTimeHHmm(row.timeOutRaw || undefined);

      if (row.timeInRaw && !timeIn) {
        return NextResponse.json(
          { message: `Format jam masuk tidak valid: ${row.timeInRaw}` },
          { status: 400 }
        );
      }

      if (row.timeOutRaw && !timeOut) {
        return NextResponse.json(
          { message: `Format jam keluar tidak valid: ${row.timeOutRaw}` },
          { status: 400 }
        );
      }

      let timeInDate: Date | null = null;
      let timeOutDate: Date | null = null;

      if (timeIn) {
        const [hStr, mStr] = timeIn.split(":");
        const h = Number(hStr);
        const m = Number(mStr);
        const d = new Date(row.scheduleDate);
        d.setHours(h, m, 0, 0);
        timeInDate = d;
      }

      if (timeOut) {
        const [hStr, mStr] = timeOut.split(":");
        const h = Number(hStr);
        const m = Number(mStr);
        const d = new Date(row.scheduleDate);
        d.setHours(h, m, 0, 0);
        timeOutDate = d;
      }

      await prisma.attendance.upsert({
        where: { scheduleId: row.scheduleId },
        create: {
          scheduleId: row.scheduleId,
          timeIn: timeInDate,
          timeOut: timeOutDate,
        },
        update: {
          timeIn: timeInDate,
          timeOut: timeOutDate,
        },
      });
    }

    return NextResponse.json({ message: "Import absensi berhasil" });
  } catch (error) {
    console.error("Import attendance error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
