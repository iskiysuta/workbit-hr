"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: number;
  level: string;
  title: string;
  totalSalary: number;
  isFullSalaryPayroll: boolean;
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [level, setLevel] = useState("");
  const [title, setTitle] = useState("");
  const [totalSalary, setTotalSalary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isFullSalaryPayroll, setIsFullSalaryPayroll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setJobs(data);
      } catch {
        setError("Tidak dapat memuat data jabatan");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
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
        setError(data.message || "Gagal menambah jabatan");
        return;
      }
      setJobs((prev) => [data, ...prev]);
      setLevel("");
      setTitle("");
      setTotalSalary("");
      setIsFullSalaryPayroll(false);
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jabatan</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Atur level jabatan dan total gaji.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          Tambah Jabatan
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Tambah Jabatan</h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Isi level, jabatan, total gaji, dan aturan payroll.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
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
                    id="full-salary"
                    type="checkbox"
                    checked={isFullSalaryPayroll}
                    onChange={(e) => setIsFullSalaryPayroll(e.target.checked)}
                    className="mt-0.5 h-3 w-3 rounded border-input text-primary focus:ring-1 focus:ring-ring"
                  />
                  <label
                    htmlFor="full-salary"
                    className="select-none text-[11px] text-zinc-700 dark:text-zinc-200"
                  >
                    Gaji full 100% dari total gaji (tanpa pengaruh hari kerja &
                    keterlambatan). Cocok untuk level C, PIC, Security, dll.
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
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

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm dark:border-zinc-800">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Level</th>
                <th className="px-4 py-2">Jabatan</th>
                <th className="px-4 py-2">Total Gaji</th>
                <th className="px-4 py-2">Mode Payroll</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={3}>
                    Memuat data...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={3}>
                    Belum ada data jabatan.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="cursor-pointer border-t border-border/60 hover:bg-muted/60"
                  >
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {job.level}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {job.title}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {job.totalSalary.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2 align-middle text-[11px]">
                      {job.isFullSalaryPayroll ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Full Salary
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
