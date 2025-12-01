"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registrasi gagal");
      } else {
        setMessage(data.message || "Registrasi berhasil");
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/10">
      <main className="w-full max-w-md bg-white shadow-lg rounded-2xl border border-primary/30 p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primary text-center">
            Register
          </h1>
          <p className="text-sm text-zinc-600 text-center">
            Buat akun baru untuk aplikasi HR.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-800">
              Nama
            </label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan nama lengkap"
              disabled={loading}
            />
          </div>

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
            {loading ? "Memproses..." : "Register"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 text-center mt-2">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-600 text-center mt-2">{message}</p>
        )}

        <p className="text-center text-sm text-zinc-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
