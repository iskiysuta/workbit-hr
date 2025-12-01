"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PayrollItemDetail = {
  id: number;
  employee: {
    id: number;
    name: string;
    companyId: string;
  };
  totalSalary: number;
  isFullSalaryPayroll: boolean;
  scheduledWorkingDays: number;
  workingDays: number;
  offDays: number;
  absentDays: number;
  lateCount: number;
  totalLateMinutes: number;
  totalWorkMinutes: number;
  loanInstallment: number;
  baseSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  healthAllowance: number;
  grossBeforePenalty: number;
  latePenalty: number;
  extraDeduction: number;
  extraAddition: number;
  thp: number;
};

type PayrollPeriodDetail = {
  id: number;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  items: PayrollItemDetail[];
};

export default function PayrollHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PayrollPeriodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PayrollItemDetail | null>(
    null
  );
  const [showSlip, setShowSlip] = useState(false);

  const periodLabel = useMemo(() => {
    if (!data) return "-";
    const mm = String(data.month).padStart(2, "0");
    return `${mm}/${data.year}`;
  }, [data]);

  const rangeLabel = useMemo(() => {
    if (!data) return "-";
    return `${new Date(data.periodStart).toLocaleDateString(
      "id-ID"
    )} - ${new Date(data.periodEnd).toLocaleDateString("id-ID")}`;
  }, [data]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/payroll/history/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || "Gagal memuat detail payroll");
          return;
        }
        setData(json as PayrollPeriodDetail);
      } catch {
        setError("Terjadi kesalahan saat memuat detail payroll");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleExport = () => {
    if (!data) return;
    window.location.href = `/api/payroll/history/${data.id}/export`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Memuat detail payroll...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Detail Payroll
          </h1>
          <button
            type="button"
            onClick={() => router.push("/payroll?tab=history")}
            className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Kembali
          </button>
        </div>
        <p className="text-sm text-red-600">{error || "Data tidak ditemukan"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Detail Payroll
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Periode {periodLabel} ({rangeLabel})
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Diproses pada {new Date(data.createdAt).toLocaleString("id-ID")} -
            Total karyawan: {data.items.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/payroll?tab=history")}
            className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Export XLSX
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Karyawan</th>
                <th className="px-4 py-2">HK</th>
                <th className="px-4 py-2">Jadwal</th>
                <th className="px-4 py-2">Libur</th>
                <th className="px-4 py-2">Tidak Masuk</th>
                <th className="px-4 py-2">Terlambat</th>
                <th className="px-4 py-2">Total Gaji</th>
                <th className="px-4 py-2">Pinjaman</th>
                <th className="px-4 py-2">Pot. Telat</th>
                <th className="px-4 py-2">Pot. Lain</th>
                <th className="px-4 py-2">Tambahan</th>
                <th className="px-4 py-2">THP</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-800 dark:text-zinc-100">
                    {item.employee.companyId} - {item.employee.name}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.workingDays}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.scheduledWorkingDays}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.offDays}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.absentDays}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.lateCount}x ({item.totalLateMinutes} mnt)
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.totalSalary.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.loanInstallment.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.latePenalty.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.extraDeduction.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    {item.extraAddition.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {item.thp.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-zinc-700 dark:text-zinc-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowSlip(true);
                      }}
                      className="rounded-md border border-input px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Lihat Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSlip && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Slip Gaji
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Periode {periodLabel} ({rangeLabel})
                </p>
                <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-200">
                  {selectedItem.employee.companyId} - {" "}
                  {selectedItem.employee.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSlip(false);
                  setSelectedItem(null);
                }}
                className="rounded-md border border-input px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 rounded-md bg-zinc-50 p-3 text-[11px] text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <div>
                <p className="font-semibold">Informasi Karyawan</p>
                <p>ID: {selectedItem.employee.companyId}</p>
                <p>Nama: {selectedItem.employee.name}</p>
              </div>
              <div>
                <p className="font-semibold">Ringkasan Kehadiran</p>
                <p>Hari Kerja: {selectedItem.workingDays}</p>
                <p>Tidak Masuk: {selectedItem.absentDays}</p>
                <p>
                  Terlambat: {selectedItem.lateCount}x ({" "}
                  {selectedItem.totalLateMinutes} menit)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-[11px] text-zinc-800 dark:text-zinc-100 sm:grid-cols-2">
              <div className="rounded-md border border-dashed border-zinc-200 p-3 dark:border-zinc-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Komponen Gaji
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Gaji Pokok</span>
                    <span>
                      {selectedItem.baseSalary.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tunjangan Jabatan</span>
                    <span>
                      {selectedItem.positionAllowance.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tunjangan Transport</span>
                    <span>
                      {selectedItem.transportAllowance.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tunjangan Makan</span>
                    <span>
                      {selectedItem.mealAllowance.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tunjangan Kesehatan</span>
                    <span>
                      {selectedItem.healthAllowance.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-dashed border-zinc-200 pt-2 text-[11px] font-semibold dark:border-zinc-700">
                    <span>Total Gaji</span>
                    <span>
                      {selectedItem.totalSalary.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-dashed border-zinc-200 p-3 dark:border-zinc-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Potongan
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Potongan Terlambat</span>
                    <span>
                      {selectedItem.latePenalty.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potongan Pinjaman</span>
                    <span>
                      {selectedItem.loanInstallment.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potongan Lainnya</span>
                    <span>
                      {selectedItem.extraDeduction.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penambahan Lainnya</span>
                    <span>
                      {selectedItem.extraAddition.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-dashed border-zinc-200 pt-2 text-[11px] font-semibold dark:border-zinc-700">
                    <span>Total Potongan Bersih</span>
                    <span>
                      {(
                        selectedItem.latePenalty +
                        selectedItem.loanInstallment +
                        selectedItem.extraDeduction -
                        selectedItem.extraAddition
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Take Home Pay</span>
                <span className="text-base font-bold">
                  {selectedItem.thp.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
