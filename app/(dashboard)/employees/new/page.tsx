"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Job = {
  id: number;
  level: string;
  title: string;
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyId: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    joinedAt: "",
    position: "",
    level: "",
    address: "",
    bankName: "",
    bankAccount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setJobs(data);
      } catch {
        setJobsError("Tidak dapat memuat data jabatan. Pastikan sudah mengisi master jabatan.");
      }
    }
    loadJobs();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleJobChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const jobId = Number(e.target.value);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    setForm((prev) => ({
      ...prev,
      position: job.title,
      level: job.level,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal menambah karyawan");
        return;
      }

      router.push("/employees");
    } catch {
      setError("Terjadi kesalahan pada server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tambah Karyawan
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Isi data karyawan baru secara lengkap.
        </p>
      </div>

      {jobsError && <p className="text-sm text-red-600">{jobsError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-card p-4 shadow-sm dark:border-zinc-800"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Pilih Jabatan (Level - Jabatan)
            </label>
            <select
              onChange={handleJobChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              defaultValue=""
            >
              <option value="" disabled>
                -- Pilih dari master jabatan --
              </option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{`
                  ${job.level} - ${job.title}
                `}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              ID Perusahaan
            </label>
            <input
              type="text"
              name="companyId"
              value={form.companyId}
              onChange={handleChange}
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
              name="name"
              value={form.name}
              onChange={handleChange}
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
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Password (login android)
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Tanggal Bergabung
            </label>
            <input
              type="date"
              name="joinedAt"
              value={form.joinedAt}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Jabatan
            </label>
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              readOnly
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Level Jabatan
            </label>
            <input
              type="text"
              name="level"
              value={form.level}
              onChange={handleChange}
              readOnly
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Alamat
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Nama Bank
            </label>
            <input
              type="text"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              No Rekening
            </label>
            <input
              type="text"
              name="bankAccount"
              value={form.bankAccount}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/employees")}
            className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
