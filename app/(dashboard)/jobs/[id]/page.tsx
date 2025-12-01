"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Job = {
  id: number;
  level: string;
  title: string;
  totalSalary: number;
  isFullSalaryPayroll: boolean;
};

export default function JobDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const jobId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "";
  }, [pathname]);
  const [job, setJob] = useState<Job | null>(null);
  const [level, setLevel] = useState("");
  const [title, setTitle] = useState("");
  const [totalSalary, setTotalSalary] = useState("");
  const [isFullSalaryPayroll, setIsFullSalaryPayroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error();
        const data: Job = await res.json();
        setJob(data);
        setLevel(data.level);
        setTitle(data.title);
        setTotalSalary(String(data.totalSalary));
        setIsFullSalaryPayroll(data.isFullSalaryPayroll);
      } catch {
        setError("Tidak dapat memuat data jabatan");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          title,
          totalSalary: Number(totalSalary),
          isFullSalaryPayroll,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan jabatan");
        return;
      }
      setJob(data);
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus jabatan ini?")) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menghapus jabatan");
        setDeleting(false);
        return;
      }
      router.push("/jobs");
    } catch {
      setError("Terjadi kesalahan pada server");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Memuat data jabatan...</p>;
  }

  if (!job) {
    return <p className="text-sm text-red-600">Jabatan tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Detail Jabatan
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Edit level jabatan, total gaji, dan aturan payroll atau hapus
            jabatan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Kembali
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg border bg-card p-4 text-sm shadow-sm dark:border-zinc-800"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Level
            </label>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Jabatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Total Gaji
            </label>
            <input
              type="number"
              min={0}
              value={totalSalary}
              onChange={(e) => setTotalSalary(e.target.value)}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
            Aturan Payroll
          </label>
          <div className="flex items-start gap-2 rounded-md border border-input bg-white px-3 py-2 text-xs shadow-sm dark:bg-zinc-950">
            <input
              id="full-salary-detail"
              type="checkbox"
              checked={isFullSalaryPayroll}
              onChange={(e) => setIsFullSalaryPayroll(e.target.checked)}
              className="mt-0.5 h-3 w-3 rounded border-input text-primary focus:ring-1 focus:ring-ring"
            />
            <label
              htmlFor="full-salary-detail"
              className="select-none text-[11px] text-zinc-700 dark:text-zinc-200"
            >
              Gaji full 100% dari total gaji (tanpa pengaruh hari kerja &
              keterlambatan). Cocok untuk level C, PIC, Security, dll.
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            {deleting ? "Menghapus..." : "Hapus Jabatan"}
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
