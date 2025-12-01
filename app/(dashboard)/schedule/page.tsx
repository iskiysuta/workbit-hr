"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  isDayOff?: boolean;
};

type Employee = {
  id: number;
  name: string;
  companyId: string;
};

type ScheduleItem = {
  id: number;
  date: string;
  employee: Employee;
  shift: {
    id: number;
    name: string;
  };
};

export default function SchedulePage() {
  const [tab, setTab] = useState<"shifts" | "schedules">("shifts");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jadwal</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Atur shift dan jadwal harian karyawan.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/60 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("shifts")}
          className={`px-3 py-2 border-b-2 transition-colors ${
            tab === "shifts"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Daftar Shift
        </button>
        <button
          type="button"
          onClick={() => setTab("schedules")}
          className={`px-3 py-2 border-b-2 transition-colors ${
            tab === "schedules"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          List Jadwal
        </button>
      </div>

      {tab === "shifts" ? <ShiftsTab /> : <SchedulesTab />}
    </div>
  );
}

function ShiftsTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [grace, setGrace] = useState("0");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDayOff, setIsDayOff] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/shifts");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setShifts(data);
      } catch {
        setError("Tidak dapat memuat data shift");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setStartTime("");
    setEndTime("");
    setGrace("0");
    setIsDayOff(false);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(shift: Shift) {
    setEditing(shift);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setGrace(String(shift.gracePeriodMinutes));
    setIsDayOff(Boolean(shift.isDayOff));
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        name,
        startTime,
        endTime,
        gracePeriodMinutes: Number(grace),
        isDayOff,
      };
      const url = editing ? `/api/shifts/${editing.id}` : "/api/shifts";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan shift");
        return;
      }

      if (editing) {
        setShifts((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      } else {
        setShifts((prev) => [data, ...prev]);
      }
      setModalOpen(false);
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm("Yakin ingin menghapus shift ini?")) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/shifts/${editing.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menghapus shift");
        setDeleting(false);
        return;
      }
      setShifts((prev) => prev.filter((s) => s.id !== editing.id));
      setModalOpen(false);
    } catch {
      setError("Terjadi kesalahan pada server");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Daftar Shift</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Kelola master shift kerja.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          Tambah Shift
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm dark:border-zinc-800">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Nama Shift</th>
                <th className="px-4 py-2">Jam Masuk</th>
                <th className="px-4 py-2">Jam Keluar</th>
                <th className="px-4 py-2">Grace (menit)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Memuat data...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Belum ada data shift.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    onClick={() => openEdit(shift)}
                    className="cursor-pointer border-t border-border/60 hover:bg-muted/60"
                  >
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {shift.name}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {shift.isDayOff ? "-" : shift.startTime}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {shift.isDayOff ? "-" : shift.endTime}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {shift.isDayOff ? "-" : shift.gracePeriodMinutes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {editing ? "Edit Shift" : "Tambah Shift"}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Isi data shift kerja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>

            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Nama Shift
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                  required
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  id="isDayOff"
                  type="checkbox"
                  checked={isDayOff}
                  onChange={(e) => setIsDayOff(e.target.checked)}
                  className="h-3 w-3 rounded border border-input"
                />
                <label
                  htmlFor="isDayOff"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-200"
                >
                  Day Off (Libur, tanpa jam masuk/keluar)
                </label>
              </div>
              {!isDayOff && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Jam Keluar
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Grace Period (menit)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={grace}
                      onChange={(e) => setGrace(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {editing ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-md border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                  >
                    {deleting ? "Menghapus..." : "Hapus Shift"}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SchedulesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalShiftId, setModalShiftId] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSchedules = useMemo(
    () =>
      schedules.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          item.employee.name.toLowerCase().includes(term) ||
          item.employee.companyId.toLowerCase().includes(term) ||
          item.shift.name.toLowerCase().includes(term)
        );
      }),
    [schedules, searchTerm]
  );

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    async function loadBase() {
      try {
        const [empRes, shiftRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/shifts"),
        ]);
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(
            empData.map((e: any) => ({
              id: e.id,
              name: e.name,
              companyId: e.companyId,
            }))
          );
        }
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShifts(shiftData);
        }
      } catch {
        setError("Tidak dapat memuat data awal jadwal");
      } finally {
        setLoading(false);
      }
    }
    loadBase();
  }, []);

  useEffect(() => {
    async function loadSchedules() {
      if (!startDate || !endDate) return;
      try {
        const params = new URLSearchParams({ startDate, endDate });
        if (employeeId) {
          params.set("employeeId", employeeId);
        }
        const res = await fetch(`/api/schedules?${params.toString()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSchedules(data);
      } catch {
        setError("Tidak dapat memuat list jadwal");
      }
    }
    loadSchedules();
  }, [employeeId, startDate, endDate]);

  function openCreateSchedule() {
    const defaultEmployeeId =
      employeeId || (employees[0] ? String(employees[0].id) : "");
    const today = new Date().toISOString().slice(0, 10);
    const defaultDate = startDate || endDate || today;
    const defaultShiftId = shifts[0] ? String(shifts[0].id) : "";

    setModalEmployeeId(defaultEmployeeId);
    setModalDate(defaultDate);
    setModalShiftId(defaultShiftId);
    setEditingScheduleId(null);
    setError(null);
    setSaving(false);
    setModalOpen(true);
  }

  function openEditSchedule(item: ScheduleItem) {
    setModalEmployeeId(String(item.employee.id));
    setModalDate(item.date.slice(0, 10));
    setModalShiftId(String(item.shift.id));
    setEditingScheduleId(item.id);
    setError(null);
    setSaving(false);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const isEditing = editingScheduleId !== null;
      const url = isEditing ? `/api/schedules/${editingScheduleId}` : "/api/schedules";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: modalEmployeeId,
          date: modalDate,
          shiftId: modalShiftId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan jadwal");
        return;
      }

      if (modalEmployeeId && modalDate) {
        const params = new URLSearchParams({
          employeeId: modalEmployeeId,
          startDate: modalDate,
          endDate: modalDate,
        });
        const listRes = await fetch(`/api/schedules?${params.toString()}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          setSchedules(listData);
          setEmployeeId(modalEmployeeId);
          setStartDate(modalDate);
          setEndDate(modalDate);
        }
      }

      setModalOpen(false);
      setEditingScheduleId(null);
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menghapus jadwal");
        return;
      }
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Terjadi kesalahan pada server");
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

      const res = await fetch("/api/schedules/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Import jadwal gagal");
      } else {
        setImportMessage(data.message || "Import jadwal berhasil");

        if (startDate && endDate) {
          const params = new URLSearchParams({ startDate, endDate });
          if (employeeId) {
            params.set("employeeId", employeeId);
          }
          const listRes = await fetch(`/api/schedules?${params.toString()}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            setSchedules(listData);
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan saat import jadwal");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
      setImporting(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">List Jadwal</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Tentukan shift harian untuk setiap karyawan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateSchedule}
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              Tambah Jadwal
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
              disabled={importing}
            >
              {importing ? "Mengimpor..." : "Import XLSX"}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportChange}
            />
            <a
              href="/api/schedules/template"
              className="inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
            >
              Download Template
            </a>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Karyawan
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            >
              <option value="">-- Pilih karyawan --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{`
                    ${emp.companyId} - ${emp.name}
                  `}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Tanggal Awal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Cari (nama / shift)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama karyawan atau nama shift"
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {importMessage && (
          <p className="text-sm text-green-600">{importMessage}</p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm dark:border-zinc-800">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Karyawan</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Shift</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Memuat data...
                  </td>
                </tr>
              ) : !startDate || !endDate ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Pilih rentang tanggal untuk melihat jadwal.
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Belum ada jadwal pada rentang tanggal tersebut.
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={4}>
                    Tidak ada jadwal yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {item.employee.companyId} - {item.employee.name}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {new Date(item.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {item.shift.name}
                    </td>
                    <td className="px-4 py-2 align-middle text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSchedule(item)}
                          className="rounded-md border border-primary/40 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {editingScheduleId ? "Edit Jadwal" : "Tambah Jadwal"}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Pilih karyawan, tanggal, dan shift untuk menjadwalkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>

            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Karyawan
                </label>
                <select
                  value={modalEmployeeId}
                  onChange={(e) => setModalEmployeeId(e.target.value)}
                  disabled={editingScheduleId !== null}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                  required
                >
                  <option value="">-- Pilih karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{`
                        ${emp.companyId} - ${emp.name}
                      `}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Shift
                </label>
                <select
                  value={modalShiftId}
                  onChange={(e) => setModalShiftId(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                  required
                >
                  <option value="">-- Pilih shift --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.isDayOff
                        ? s.name
                        : `${s.name} (${s.startTime} - ${s.endTime})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
