"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EmployeeOption {
  id: number;
  name: string;
  companyId: string;
}

interface MeResponse {
  employee: {
    id: number;
  };
}

export default function MobileShiftSwapRequestPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [targetId, setTargetId] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
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

        const [meRes, empRes] = await Promise.all([
          fetch("/api/mobile/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/employees"),
        ]);

        const meData: MeResponse = await meRes.json().catch(() => ({} as any));
        const empData: any[] = await empRes.json().catch(() => []);

        if (!meRes.ok) {
          throw new Error((meData as any)?.message || "Gagal memuat profil");
        }
        if (!empRes.ok) {
          throw new Error((empData as any)?.message || "Gagal memuat karyawan");
        }

        const myId = meData.employee.id;
        const list: EmployeeOption[] = (empData || []).map((e) => ({
          id: e.id,
          name: e.name,
          companyId: e.companyId,
        }));

        setEmployees(list.filter((e) => e.id !== myId));
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Terjadi kesalahan saat memuat data");
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
    if (!targetId) {
      setError("Karyawan tujuan wajib dipilih");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/mobile/me/shift-swap-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          targetEmployeeId: Number(targetId),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim request");
      }

      setSuccess(data?.message || "Request tukar shift berhasil dikirim");
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
        <h1 className="text-lg font-semibold text-primary">Request Tukar Shift</h1>
        <p className="text-xs text-zinc-600">
          Pilih tanggal dan karyawan tujuan untuk tukar shift.
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
          <label className="text-xs text-zinc-500">Tukar dengan</label>
          <select
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white"
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setError(null);
            }}
          >
            <option value="">Pilih karyawan</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.companyId} - {e.name}
              </option>
            ))}
          </select>
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
