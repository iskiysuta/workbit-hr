"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EmployeeProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
  position: string | null;
  joinedAt: string | null;
}

export default function MobileProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);

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

      const res = await fetch("/api/mobile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat profil");
      }

      setEmployee(data.employee as EmployeeProfile);
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

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mobile_token");
      localStorage.removeItem("mobile_employee_name");
      localStorage.removeItem("mobile_employee_company_id");
    }
    router.replace("/mobile/login");
  }

  function formatDate(raw: string | null): string {
    if (!raw) return "-";
    try {
      const d = new Date(raw);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return raw;
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8">
        <p className="text-sm text-zinc-600">Memuat profil...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8 space-y-4">
        <p className="text-sm text-red-600">{error ?? "Profil tidak ditemukan"}</p>
        <button
          type="button"
          onClick={() => router.replace("/mobile")}
          className="rounded-md bg-primary text-white px-3 py-2 text-sm font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-primary">Profil</h1>
        <p className="text-xs text-zinc-600">Lihat informasi akun dan logout.</p>
      </div>

      {/* Card profil */}
      <div className="rounded-2xl border border-primary/60 bg-white p-4 space-y-3 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Nama</p>
          <p className="font-semibold text-zinc-900">{employee.name}</p>
        </div>
        {employee.companyId && (
          <div>
            <p className="text-xs text-zinc-500">ID Karyawan</p>
            <p className="text-zinc-900">{employee.companyId}</p>
          </div>
        )}
        {employee.position && (
          <div>
            <p className="text-xs text-zinc-500">Jabatan</p>
            <p className="text-zinc-900">{employee.position}</p>
          </div>
        )}
        {employee.email && (
          <div>
            <p className="text-xs text-zinc-500">Email</p>
            <p className="text-zinc-900">{employee.email}</p>
          </div>
        )}
        {employee.phone && (
          <div>
            <p className="text-xs text-zinc-500">No. HP</p>
            <p className="text-zinc-900">{employee.phone}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-zinc-500">Tanggal Bergabung</p>
          <p className="text-zinc-900">{formatDate(employee.joinedAt)}</p>
        </div>
      </div>

      <div className="mt-auto flex justify-end pt-8">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-red-500 px-4 py-2 text-xs font-semibold text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
