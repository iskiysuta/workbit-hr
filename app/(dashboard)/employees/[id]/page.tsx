"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  position: string;
  level: string;
  address: string;
  bankName: string;
  bankAccount: string;
};

type Job = {
  id: number;
  level: string;
  title: string;
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const employeeId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "";
  }, [pathname]);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        if (!res.ok) throw new Error();
        const data: Employee = await res.json();
        setEmployee(data);
        setCompanyId(data.companyId);
        setName(data.name);
        setPhone(data.phone);
        setEmail(data.email);
        setJoinedAt(new Date(data.joinedAt).toISOString().slice(0, 10));
        setPosition(data.position);
        setLevel(data.level);
        setAddress(data.address);
        setBankName(data.bankName);
        setBankAccount(data.bankAccount);
      } catch {
        setError("Tidak dapat memuat data karyawan");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error();
        const data: Job[] = await res.json();
        setJobs(data);
      } catch {
        setJobsError(
          "Tidak dapat memuat data jabatan. Pastikan sudah mengisi master jabatan."
        );
      }
    }
    loadJobs();
  }, []);

  const levelOptions = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.level))),
    [jobs]
  );

  const positionOptions = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.title))),
    [jobs]
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          name,
          phone,
          email,
          joinedAt,
          position,
          level,
          address,
          bankName,
          bankAccount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan karyawan");
        return;
      }
      setEmployee(data);
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus karyawan ini?")) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menghapus karyawan");
        setDeleting(false);
        return;
      }
      router.push("/employees");
    } catch {
      setError("Terjadi kesalahan pada server");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Memuat data karyawan...</p>;
  }

  if (!employee) {
    return <p className="text-sm text-red-600">Karyawan tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Detail Karyawan
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Edit data karyawan atau hapus karyawan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/employees")}
          className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Kembali
        </button>
      </div>

      {jobsError && <p className="text-sm text-red-600">{jobsError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg border bg-card p-4 text-sm shadow-sm dark:border-zinc-800"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              ID Perusahaan
            </label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Nama
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              No HP
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Tanggal Bergabung
            </label>
            <input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Jabatan
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            >
              <option value="">-- Pilih jabatan --</option>
              {positionOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Level Jabatan
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            >
              <option value="">-- Pilih level --</option>
              {levelOptions.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Alamat
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Nama Bank
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              No Rekening
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            {deleting ? "Menghapus..." : "Hapus Karyawan"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
