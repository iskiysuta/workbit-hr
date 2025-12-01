import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

function parseJoinedDate(raw: string | undefined): Date {
  if (!raw) return new Date();
  const value = raw.trim();
  if (!value) return new Date();

  const parts = value.split(/[\/\-]/);
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

  return new Date();
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    type ParsedRow = {
      companyId: string;
      name: string;
      phone: string;
      email: string;
      passwordRaw: string;
      joinedRaw: string;
      position: string;
      level: string;
      address: string;
      bankName: string;
      bankAccount: string;
    };

    const parsed: ParsedRow[] = [];
    for (const row of rows) {
      const companyId = String(
        row.companyId || row["ID Perusahaan"] || ""
      ).trim();
      const name = String(row.name || row["Nama"] || "").trim();
      const phone = String(row.phone || row["No Hp"] || "").trim();
      const email = String(row.email || row["Email"] || "").trim();
      const passwordRaw = String(
        row.password || row["Password"] || ""
      ).trim();
      const joinedRaw = String(
        row.joinedAt || row["Tanggal Bergabung"] || ""
      ).trim();
      const position = String(row.position || row["Jabatan"] || "").trim();
      const level = String(row.level || row["Level Jabatan"] || "").trim();
      const address = String(row.address || row["Alamat"] || "").trim();
      const bankName = String(row.bankName || row["Nama Bank"] || "").trim();
      const bankAccount = String(
        row.bankAccount || row["No Rekening"] || ""
      ).trim();

      if (!companyId || !name || !email || !passwordRaw || !position || !level) {
        continue;
      }

      parsed.push({
        companyId,
        name,
        phone,
        email,
        passwordRaw,
        joinedRaw,
        position,
        level,
        address,
        bankName,
        bankAccount,
      });
    }

    // Validasi: semua kombinasi level + jabatan harus sudah ada di tabel Job
    const jobs = await prisma.job.findMany();
    const jobMap = new Map<string, number>();
    for (const job of jobs) {
      const key = `${job.level}|||${job.title}`;
      jobMap.set(key, job.id);
    }

    const missing = new Set<string>();
    for (const row of parsed) {
      const key = `${row.level}|||${row.position}`;
      if (!jobMap.has(key)) {
        missing.add(`${row.level} - ${row.position}`);
      }
    }

    if (missing.size > 0) {
      return NextResponse.json(
        {
          message:
            "Import gagal. Terdapat jabatan/level yang belum terdaftar di master jabatan:",
          details: Array.from(missing),
        },
        { status: 400 }
      );
    }

    const created: number[] = [];
    for (const row of parsed) {
      const key = `${row.level}|||${row.position}`;
      const jobId = jobMap.get(key)!;

      const hashedPassword = await bcrypt.hash(row.passwordRaw, 10);
      const joinedAt = parseJoinedDate(row.joinedRaw);

      try {
        const employee = await prisma.employee.create({
          data: {
            companyId: row.companyId,
            name: row.name,
            phone: row.phone,
            email: row.email,
            password: hashedPassword,
            joinedAt,
            position: row.position,
            level: row.level,
            address: row.address,
            bankName: row.bankName,
            bankAccount: row.bankAccount,
            jobId,
          },
        });
        created.push(employee.id);
      } catch (e) {
        console.error("Skip employee row due to error", e);
        continue;
      }
    }

    return NextResponse.json(
      { message: `Import selesai. Berhasil menambah ${created.length} karyawan.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import employees error", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
