"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface PeriodInfo {
  id: number;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  processedAt: string;
}

interface SlipDetail {
  payrollItemId: number;
  totalSalary: number;
  isFullSalaryPayroll: boolean;
  scheduledWorkingDays: number | null;
  workingDays: number | null;
  offDays: number | null;
  absentDays: number | null;
  lateCount: number | null;
  totalLateMinutes: number | null;
  totalWorkMinutes: number | null;
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
}

export default function MobilePayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [slip, setSlip] = useState<SlipDetail | null>(null);

  async function load() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      setError("ID slip gaji tidak valid");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/mobile/me/payslips/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat detail slip gaji");
      }

      setPeriod(data.period as PeriodInfo);
      setSlip(data.slip as SlipDetail);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (idParam) {
      void load();
    }
  }, [idParam]);

  const titleLabel = useMemo(() => {
    if (!period) return "Slip Gaji";
    try {
      return `Slip Gaji ${String(period.month).padStart(2, "0")}/${period.year}`;
    } catch {
      return "Slip Gaji";
    }
  }, [period]);

  function formatCurrency(value: number): string {
    if (typeof value !== "number") return "-";
    try {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return value.toString();
    }
  }

  const totalDeductions = useMemo(() => {
    if (!slip) return 0;
    return (slip.latePenalty || 0) + (slip.loanInstallment || 0) + (slip.extraDeduction || 0);
  }, [slip]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8">
        <p className="text-sm text-zinc-600">Memuat detail slip gaji...</p>
      </div>
    );
  }

  if (error || !period || !slip) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8 space-y-4">
        <p className="text-sm text-red-600">{error ?? "Data slip gaji tidak ditemukan"}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md bg-primary text-white px-3 py-2 text-sm font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-primary">{titleLabel}</h1>
        <p className="text-xs text-zinc-600">
          THP: <span className="font-semibold text-emerald-700">{formatCurrency(slip.thp)}</span>
        </p>
      </div>

      {/* Earnings */}
      <div className="rounded-2xl border border-primary/50 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-primary">Earnings</p>
        <div className="space-y-1 text-xs text-zinc-800">
          <div className="flex justify-between">
            <span>Gaji Pokok</span>
            <span>{formatCurrency(slip.baseSalary)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tunjangan Jabatan</span>
            <span>{formatCurrency(slip.positionAllowance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tunjangan Transport</span>
            <span>{formatCurrency(slip.transportAllowance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tunjangan Makan</span>
            <span>{formatCurrency(slip.mealAllowance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tunjangan Kesehatan</span>
            <span>{formatCurrency(slip.healthAllowance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tambahan Lain</span>
            <span>{formatCurrency(slip.extraAddition)}</span>
          </div>
        </div>
        <div className="h-px bg-zinc-200" />
        <div className="flex justify-between text-xs font-semibold text-zinc-900">
          <span>Total Earnings</span>
          <span>{formatCurrency(slip.totalSalary)}</span>
        </div>
      </div>

      {/* Deductions */}
      <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-red-600">Deductions</p>
        <div className="space-y-1 text-xs text-zinc-800">
          <div className="flex justify-between">
            <span>Potongan Telat</span>
            <span>{formatCurrency(slip.latePenalty)}</span>
          </div>
          <div className="flex justify-between">
            <span>Potongan Pinjaman</span>
            <span>{formatCurrency(slip.loanInstallment)}</span>
          </div>
          <div className="flex justify-between">
            <span>Potongan Lain</span>
            <span>{formatCurrency(slip.extraDeduction)}</span>
          </div>
        </div>
        <div className="h-px bg-zinc-200" />
        <div className="flex justify-between text-xs font-semibold text-zinc-900">
          <span>Total Deductions</span>
          <span>{formatCurrency(totalDeductions)}</span>
        </div>
      </div>

      {/* Take Home Pay */}
      <div className="mt-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex justify-between items-center text-sm">
        <span className="font-semibold text-emerald-800">Take Home Pay</span>
        <span className="font-bold text-emerald-700">{formatCurrency(slip.thp)}</span>
      </div>

      <div className="mt-auto flex justify-end pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-primary underline"
        >
          Kembali ke daftar slip
        </button>
      </div>
    </div>
  );
}
