import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(_request: NextRequest) {
  // Header kolom untuk import absensi
  const headers = ["ID Perusahaan", "Tanggal", "Jam Masuk", "Jam Keluar"];

  const exampleData = [
    {
      "ID Perusahaan": "ZAN-0001",
      Tanggal: "28/11/2025",
      "Jam Masuk": "08:05",
      "Jam Keluar": "17:02",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-absensi-karyawan.xlsx"',
    },
  });
}
