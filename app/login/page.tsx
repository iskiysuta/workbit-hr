"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
      } else {
        setMessage(data.message || "Login berhasil");
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <main className="w-full max-w-md bg-white shadow-lg rounded-2xl border border-primary/30 p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary text-center">
            Login
          </h1>
          <p className="text-sm text-zinc-600 text-center">
            Masuk ke akun HR kamu.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-800">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan email"
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-800">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 text-center mt-2">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-600 text-center mt-2">{message}</p>
        )}

        <p className="text-center text-sm text-zinc-600">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </main>
    </div>
  );
}
