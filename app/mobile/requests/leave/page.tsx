"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ShiftOption {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
}

export default function MobileLeaveRequestPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [date, setDate] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
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

        const res = await fetch("/api/shifts");
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data?.message || "Gagal memuat shift");
        }

        const list = (data as ShiftOption[]).filter((s) => !s.isDayOff);
        setShifts(list);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Terjadi kesalahan saat memuat shift");
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    if (!date) {
      setError("Tanggal wajib dipilih");
      return;
    }
    if (!shiftId) {
      setError("Shift wajib dipilih");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/mobile/me/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date, // format yyyy-MM-dd dari input type=date
          shiftId: Number(shiftId),
          reason: reason || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim request");
      }

      setSuccess(data?.message || "Request izin/sakit berhasil dikirim");
      setReason("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal mengirim request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-primary">Request Izin / Cuti / Sakit</h1>
        <p className="text-xs text-zinc-600">
          Pilih tanggal dan shift yang ingin diajukan, lalu isi alasan jika perlu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Tanggal</label>
          <input
            type="date"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Shift</label>
          <select
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white"
            value={shiftId}
            onChange={(e) => {
              setShiftId(e.target.value);
              setError(null);
            }}
          >
            <option value="">Pilih shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Alasan (opsional)</label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-white py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim Request"}
        </button>
      </form>

      <div className="mt-auto flex justify-end pt-4">
        <button
          type="button"
          onClick={() => router.replace("/mobile/requests")}
          className="text-xs text-primary underline"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
