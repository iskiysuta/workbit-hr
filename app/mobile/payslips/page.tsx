"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PayslipSummary {
  periodId: number;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  processedAt: string;
  thp: number;
}

export default function MobilePayslipsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  async function load() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/mobile/me/payslips", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat slip gaji");
      }

      const list = (data.payslips as PayslipSummary[]) ?? [];
      setPayslips(list);

      if (list.length > 0) {
        const latestYear = list.reduce(
          (acc, item) => (item.year > acc ? item.year : acc),
          list[0].year
        );
        setSelectedYear(latestYear);
      } else {
        setSelectedYear(new Date().getFullYear());
      }

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const baseYear =
    selectedYear ?? (payslips[0]?.year ?? new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years: number[] = [];
    const start = baseYear - 3;
    const end = baseYear + 3;
    for (let y = start; y <= end; y++) {
      years.push(y);
    }
    return years;
  }, [baseYear]);

  const filteredPayslips = useMemo(() => {
    if (!selectedYear) return payslips;
    return payslips.filter((p) => p.year === selectedYear);
  }, [payslips, selectedYear]);

  function formatMonthYear(year: number, month: number): string {
    try {
      const d = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return `${year}-${String(month).padStart(2, "0")}`;
    }
  }

  function formatDateRange(start: string, end: string): string {
    try {
      const dStart = new Date(start);
      const dEnd = new Date(end);
      const fmt = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
      });
      return `${fmt.format(dStart)} - ${fmt.format(dEnd)}`;
    } catch {
      return `${start} - ${end}`;
    }
  }

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

  if (loading && payslips.length === 0) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8">
        <p className="text-sm text-zinc-600">Memuat slip gaji...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Slip Gaji</h1>
          <p className="text-xs text-zinc-600">
            Lihat daftar slip gaji per periode payroll.
          </p>
        </div>
        {availableYears.length > 0 && (
          <button
            type="button"
            onClick={() => setYearPickerOpen(true)}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {selectedYear ?? "Pilih Tahun"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* List slip gaji */}
      <div className="space-y-3 pb-8">
        {filteredPayslips.length === 0 && !loading && !error && (
          <p className="text-sm text-zinc-600">
            Tidak ada slip gaji untuk tahun ini.
          </p>
        )}
        {filteredPayslips.map((item) => (
          <div
            key={item.periodId}
            onClick={() => router.push(`/mobile/payslips/${item.periodId}`)}
            className="rounded-xl border border-primary/60 bg-white px-3 py-2 text-sm flex flex-col gap-1 cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-medium">
                  {formatMonthYear(item.year, item.month)}
                </span>
                <span className="text-xs text-zinc-500">
                  Periode: {formatDateRange(item.periodStart, item.periodEnd)}
                </span>
              </div>
            </div>
            <div className="mt-1 flex justify-between items-center text-xs text-zinc-700">
              <span>Total diterima (THP)</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(item.thp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Year picker */}
      {yearPickerOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-semibold text-primary"
                onClick={() => setYearPickerOpen(false)}
              >
                Batal
              </button>
              <p className="text-sm font-medium text-zinc-800">Pilih Tahun</p>
              <span className="text-sm text-zinc-400">
                {selectedYear ?? "-"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {availableYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setSelectedYear(y);
                    setYearPickerOpen(false);
                  }}
                  className={`rounded-lg border px-2 py-1 text-xs text-center ${
                    y === selectedYear
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-zinc-200 text-zinc-800"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
