"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Employee = {
  id: number;
  name: string;
  companyId: string;
};

type Shift = {
  id: number;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gracePeriodMinutes: number;
  isDayOff?: boolean;
};

type AttendanceRow = {
  scheduleId: number;
  date: string;
  employee: Employee;
  shift: Shift;
  timeIn: string;
  timeOut: string;
};

type AttendanceSummaryRow = {
  employeeId: number;
  companyId: string;
  name: string;
  totalWorkingDays: number;
  totalOffDays: number;
  totalAbsentDays: number;
  totalWorkMinutes: number;
  totalLateMinutes: number;
};

function calculateLatenessMinutes(
  scheduledStart: string,
  scheduledEnd: string,
  actualIn: string,
  graceMinutes: number
) {
  if (!scheduledStart || !actualIn) return 0;
  const [sh, sm] = scheduledStart.split(":").map((n) => Number(n));
  const [eh, em] = scheduledEnd.split(":").map((n) => Number(n));
  const [ah, am] = actualIn.split(":").map((n) => Number(n));
  if ([sh, sm, eh, em, ah, am].some((n) => Number.isNaN(n))) return 0;

  const scheduledTotal = sh * 60 + sm;
  const scheduledEndTotal = eh * 60 + em;
  let actualTotal = ah * 60 + am;

  const isOvernight = scheduledEndTotal < scheduledTotal;
  // Jika shift lintas hari dan jam masuk berada setelah tengah malam (jam kecil) dan
  // jam tersebut lebih kecil dari jam mulai shift, anggap sebagai hari berikutnya.
  if (isOvernight && ah < sh && ah < 12) {
    actualTotal += 24 * 60;
  }

  const diff = actualTotal - scheduledTotal;
  if (diff <= 0) return 0;
  const late = diff - graceMinutes;
  return late > 0 ? late : 0;
}

function calculateWorkDuration(timeIn: string, timeOut: string): string {
  if (!timeIn || !timeOut) return "-";
  const [ihStr, imStr] = timeIn.split(":");
  const [ohStr, omStr] = timeOut.split(":");
  const ih = Number(ihStr);
  const im = Number(imStr);
  const oh = Number(ohStr);
  const om = Number(omStr);
  if ([ih, im, oh, om].some((n) => Number.isNaN(n))) return "-";

  const inMinutes = ih * 60 + im;
  let outMinutes = oh * 60 + om;

  // Jika jam keluar lebih kecil dari jam masuk, anggap keluar di hari berikutnya
  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60;
  }

  const diff = outMinutes - inMinutes;
  if (diff <= 0) return "-";

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours} jam ${minutes} menit`;
}

function formatTotalMinutesLabel(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} jam ${minutes} menit`;
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [date, setDate] = useState("");
  const [employeeFilterId, setEmployeeFilterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
  const [summaryMonth, setSummaryMonth] = useState("");
  const [summaryRows, setSummaryRows] = useState<AttendanceSummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString();
    const todayDate = iso.slice(0, 10); // YYYY-MM-DD
    const ym = iso.slice(0, 7); // YYYY-MM
    setDate(todayDate);
    setSummaryMonth(ym);
  }, []);

  useEffect(() => {
    async function loadBase() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployees(
            data.map((e: any) => ({
              id: e.id,
              name: e.name,
              companyId: e.companyId,
            }))
          );
        }
      } catch {
        // abaikan, error akan ditangani di loadAttendance
      }
    }
    loadBase();
  }, []);

  useEffect(() => {
    async function loadAttendance() {
      if (activeTab !== "detail") return;
      if (!date) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ date });
        if (employeeFilterId) {
          params.set("employeeId", employeeFilterId);
        }
        const res = await fetch(`/api/attendance?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Gagal memuat data absensi");
          setRows([]);
          return;
        }
        const mapped: AttendanceRow[] = data.map((item: any) => ({
          scheduleId: item.scheduleId,
          date: item.date,
          employee: item.employee,
          shift: item.shift,
          timeIn: item.attendance?.timeIn || "",
          timeOut: item.attendance?.timeOut || "",
        }));
        setRows(mapped);
      } catch {
        setError("Terjadi kesalahan saat memuat data absensi");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [date, employeeFilterId, activeTab]);

  useEffect(() => {
    async function loadSummary() {
      if (!summaryMonth) return;
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const params = new URLSearchParams({ month: summaryMonth });
        const res = await fetch(`/api/attendance/summary?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setSummaryError(data.message || "Gagal memuat resume absensi");
          setSummaryRows([]);
          return;
        }
        setSummaryRows(data as AttendanceSummaryRow[]);
      } catch {
        setSummaryError("Terjadi kesalahan saat memuat resume absensi");
        setSummaryRows([]);
      } finally {
        setSummaryLoading(false);
      }
    }

    if (activeTab === "summary") {
      loadSummary();
    }
  }, [activeTab, summaryMonth]);

  const displayedRows = useMemo(
    () =>
      rows.slice().sort((a, b) => {
        if (a.employee.name < b.employee.name) return -1;
        if (a.employee.name > b.employee.name) return 1;
        return 0;
      }),
    [rows]
  );

  async function saveAttendance(
    scheduleId: number,
    timeIn: string,
    timeOut: string
  ) {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          timeIn: timeIn || null,
          timeOut: timeOut || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan absensi");
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan absensi");
    }
  }

  async function handleDelete(row: AttendanceRow) {
    if (!confirm("Yakin ingin menghapus jam masuk/keluar untuk baris ini?"))
      return;
    setDeletingId(row.scheduleId);
    setError(null);
    try {
      const params = new URLSearchParams({
        scheduleId: String(row.scheduleId),
      });
      const res = await fetch(`/api/attendance?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menghapus data absensi");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.scheduleId === row.scheduleId
            ? { ...r, timeIn: "", timeOut: "" }
            : r
        )
      );
    } catch {
      setError("Terjadi kesalahan saat menghapus data absensi");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    setError(null);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/attendance/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Import absensi gagal");
      } else {
        setImportMessage(data.message || "Import absensi berhasil");

        if (date) {
          const params = new URLSearchParams({ date });
          if (employeeFilterId) {
            params.set("employeeId", employeeFilterId);
          }
          const listRes = await fetch(`/api/attendance?${params.toString()}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const mapped: AttendanceRow[] = listData.map((item: any) => ({
              scheduleId: item.scheduleId,
              date: item.date,
              employee: item.employee,
              shift: item.shift,
              timeIn: item.attendance?.timeIn || "",
              timeOut: item.attendance?.timeOut || "",
            }));
            setRows(mapped);
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan saat import absensi");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Absensi
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pantau dan kelola data kehadiran karyawan.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border/60 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("detail")}
          className={`rounded-t-md px-3 py-2 transition-colors ${
            activeTab === "detail"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Absensi Harian
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded-t-md px-3 py-2 transition-colors ${
            activeTab === "summary"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Resume Absensi
        </button>
      </div>
      {activeTab === "detail" && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-card p-4 shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Karyawan
                </label>
                <select
                  value={employeeFilterId}
                  onChange={(e) => setEmployeeFilterId(e.target.value)}
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                >
                  <option value="">Semua karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{`
                      ${emp.companyId} - ${emp.name}
                    `}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
                disabled={importing}
              >
                {importing ? "Mengimpor..." : "Import XLSX"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportChange}
              />
              <a
                href="/api/attendance/template"
                className="inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
              >
                Download Template
              </a>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {importMessage && (
            <p className="text-sm text-green-600">{importMessage}</p>
          )}

          <div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Karyawan</th>
                    <th className="px-4 py-2">Shift</th>
                    <th className="px-4 py-2">Jadwal Masuk</th>
                    <th className="px-4 py-2">Jadwal Keluar</th>
                    <th className="px-4 py-2">Jam Masuk</th>
                    <th className="px-4 py-2">Jam Keluar</th>
                    <th className="px-4 py-2">Keterlambatan</th>
                    <th className="px-4 py-2">Jam Kerja</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={8}
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={8}
                      >
                        Belum ada jadwal untuk tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row, index) => {
                      const lateMinutes = row.shift.isDayOff
                        ? 0
                        : calculateLatenessMinutes(
                            row.shift.startTime,
                            row.shift.endTime,
                            row.timeIn,
                            row.shift.gracePeriodMinutes
                          );
                      const workDuration = row.shift.isDayOff
                        ? "-"
                        : calculateWorkDuration(row.timeIn, row.timeOut);
                      return (
                        <tr
                          key={row.scheduleId}
                          className={
                            index % 2 === 0
                              ? "bg-background"
                              : "bg-muted/20"
                          }
                        >
                          <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                            {row.employee.companyId} - {row.employee.name}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                row.shift.isDayOff
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
                              }`}
                            >
                              {row.shift.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {row.shift.isDayOff ? "-" : row.shift.startTime}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {row.shift.isDayOff ? "-" : row.shift.endTime}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs">
                            {row.shift.isDayOff ? (
                              <span className="text-xs text-zinc-400">-</span>
                            ) : (
                              <input
                                type="time"
                                value={row.timeIn}
                                onChange={async (e) => {
                                  const value = e.target.value;
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.scheduleId === row.scheduleId
                                        ? { ...r, timeIn: value }
                                        : r
                                    )
                                  );
                                  await saveAttendance(
                                    row.scheduleId,
                                    value,
                                    row.timeOut
                                  );
                                }}
                                className="w-24 rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                              />
                            )}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs">
                            {row.shift.isDayOff ? (
                              <span className="text-xs text-zinc-400">-</span>
                            ) : (
                              <input
                                type="time"
                                value={row.timeOut}
                                onChange={async (e) => {
                                  const value = e.target.value;
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.scheduleId === row.scheduleId
                                        ? { ...r, timeOut: value }
                                        : r
                                    )
                                  );
                                  await saveAttendance(
                                    row.scheduleId,
                                    row.timeIn,
                                    value
                                  );
                                }}
                                className="w-24 rounded-md border border-input bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                              />
                            )}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {lateMinutes > 0 ? `${lateMinutes} menit` : "-"}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {workDuration}
                          </td>
                          <td className="px-4 py-2 align-middle text-right text-xs">
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              disabled={deletingId === row.scheduleId}
                              className="rounded-md border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                            >
                              {deletingId === row.scheduleId
                                ? "Menghapus..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "summary" && (
        <>
          <div className="space-y-3 rounded-lg bg-card p-4 shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Bulan (periode 26 bulan sebelumnya s/d 25 bulan ini)
                </label>
                <input
                  type="month"
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                />
              </div>
            </div>
            {summaryError && (
              <p className="text-sm text-red-600">{summaryError}</p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Karyawan</th>
                    <th className="px-4 py-2">Total Hari Kerja</th>
                    <th className="px-4 py-2">Total Jam Kerja</th>
                    <th className="px-4 py-2">Total Libur</th>
                    <th className="px-4 py-2">Total Tidak Masuk</th>
                    <th className="px-4 py-2">Total Keterlambatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {summaryLoading ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={6}
                      >
                        Memuat resume absensi...
                      </td>
                    </tr>
                  ) : summaryRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={6}
                      >
                        Belum ada data pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((row) => (
                      <tr key={row.employeeId}>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                          {row.companyId} - {row.name}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {row.totalWorkingDays}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {formatTotalMinutesLabel(row.totalWorkMinutes)}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {row.totalOffDays}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {row.totalAbsentDays}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {formatTotalMinutesLabel(row.totalLateMinutes)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
