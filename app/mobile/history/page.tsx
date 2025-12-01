"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface HistoryItem {
  id: number;
  date: string;
  shift: {
    id: number;
    name: string;
    startTime: string | null;
    endTime: string | null;
    isDayOff: boolean;
  };
  attendance: {
    timeIn: string | null;
    timeOut: string | null;
  } | null;
}

export default function MobileHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null); // 1-12
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number | null>(null);

  const currentYearMonthLabel = useMemo(() => {
    if (!year || !month) return "-";
    try {
      const d = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return `${year}-${String(month).padStart(2, "0")}`;
    }
  }, [year, month]);

  async function load(targetYear?: number, targetMonth?: number) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let y = targetYear;
      let m = targetMonth;
      if (!y || !m) {
        const now = new Date();
        y = now.getFullYear();
        m = now.getMonth() + 1;
      }

      const monthParam = `${y}-${String(m).padStart(2, "0")}`;

      const res = await fetch(`/api/mobile/me/attendance?month=${monthParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat histori absensi");
      }

      setYear(data.year ?? y);
      setMonth(data.month ?? m);
      setItems((data.items as HistoryItem[]) ?? []);
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

  function formatDateLabel(raw: string): string {
    try {
      const d = new Date(raw);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return String(raw);
    }
  }

  function MobileTimeLabel({ value }: { value: string | null }) {
    if (!value) return <span>-</span>;
    try {
      const d = new Date(value);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return <span>{`${hh}:${mm}`}</span>;
    } catch {
      return <span>-</span>;
    }
  }

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const effectiveYear = year ?? new Date().getFullYear();
  const displayYear = pickerYear ?? effectiveYear;

  if (loading && !year && !month) {
    // First load
    return (
      <div className="flex flex-col min-h-screen px-4 py-8">
        <p className="text-sm text-zinc-600">Memuat histori absensi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Histori Absensi</h1>
          <p className="text-xs text-zinc-600">
            Lihat riwayat absen masuk dan keluar per bulan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const baseYear = year ?? new Date().getFullYear();
            setPickerYear(baseYear);
            setPickerOpen(true);
          }}
          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {currentYearMonthLabel}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* List histori */}
      <div className="space-y-3 pb-8">
        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-zinc-600">
            Tidak ada histori absensi pada bulan ini.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-primary/60 bg-white px-3 py-2 text-sm flex flex-col gap-1"
          >
            <div className="flex justify-between">
              <span className="font-medium">{formatDateLabel(item.date)}</span>
              <span className="text-xs text-zinc-500">{item.shift.name}</span>
            </div>
            <span className="text-xs text-zinc-700">
              Jam shift: {item.shift.startTime ?? "-"} - {item.shift.endTime ?? "-"}
            </span>
            <div className="mt-1 flex justify-between text-xs text-zinc-700">
              <span>
                Masuk: <MobileTimeLabel value={item.attendance?.timeIn ?? null} />
              </span>
              <span>
                Pulang: <MobileTimeLabel value={item.attendance?.timeOut ?? null} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Month picker sederhana */}
      {pickerOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-semibold text-primary"
                onClick={() => setPickerOpen(false)}
              >
                Batal
              </button>
              <p className="text-sm font-medium text-zinc-800">Pilih Bulan</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-600"
                  onClick={() =>
                    setPickerYear((prev) => (prev ?? effectiveYear) - 1)
                  }
                >
                  {"<"}
                </button>
                <span className="text-sm text-zinc-400">{displayYear}</span>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-600"
                  onClick={() =>
                    setPickerYear((prev) => (prev ?? effectiveYear) + 1)
                  }
                >
                  {" >"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {months.map((label, idx) => {
                const m = idx + 1;
                const active = m === month && displayYear === year;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      const targetYear = displayYear || effectiveYear;
                      void load(targetYear, m);
                    }}
                    className={`rounded-lg border px-2 py-1 text-xs text-left ${
                      active
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-zinc-200 text-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
