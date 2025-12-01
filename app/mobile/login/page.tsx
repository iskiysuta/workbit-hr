"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mobile/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Login gagal");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mobile_token", data.token);
        if (data.employee) {
          localStorage.setItem("mobile_employee_name", data.employee.name ?? "");
          localStorage.setItem(
            "mobile_employee_company_id",
            data.employee.companyId ?? ""
          );
        }
      }

      setLoading(false);
      router.push("/mobile");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-primary mb-1">
          Login Karyawan
        </h1>
        <p className="text-sm text-zinc-600">
          Masuk untuk mengakses jadwal, absensi, dan slip gaji.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-white py-2 text-sm font-semibold disabled:opacity-60"
       >
          {loading ? "Sedang masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
