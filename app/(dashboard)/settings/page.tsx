"use client";

import { useEffect, useState } from "react";

type AttendanceLocationSetting = {
  lat: number;
  lng: number;
  radiusMeters: number;
  source?: string;
} | null;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [radius, setRadius] = useState<string>("300");
  const [currentSource, setCurrentSource] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/settings/attendance-location");
        if (!res.ok) {
          throw new Error("Gagal memuat pengaturan");
        }
        const data: AttendanceLocationSetting = await res.json();
        if (!cancelled && data) {
          setLat(String(data.lat));
          setLng(String(data.lng));
          setRadius(String(data.radiusMeters));
          setCurrentSource(data.source);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Gagal memuat pengaturan");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const radiusNum = Number(radius);
      const res = await fetch("/api/settings/attendance-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latNum, lng: lngNum, radiusMeters: radiusNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan pengaturan");
      }
      setMessage(data?.message || "Pengaturan berhasil disimpan");
      setCurrentSource("db");
    } catch (e: any) {
      setError(e?.message ?? "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  const hasCoords = lat.trim() !== "" && lng.trim() !== "";
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        lat
      )},${encodeURIComponent(lng)}&z=17&output=embed`
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setting</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Atur preferensi aplikasi HR dan profil perusahaan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-lg border bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Lokasi Absensi
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tentukan titik lokasi kantor dan radius maksimal (meter) untuk
              absen.
            </p>
            {currentSource && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Sumber saat ini: {currentSource === "env" ? ".env" : "database"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-100">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Contoh: -6.200000"
              disabled={loading || saving}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-100">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Contoh: 106.816666"
              disabled={loading || saving}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-100">
              Radius (meter)
            </label>
            <input
              type="number"
              min={1}
              step={10}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Contoh: 300"
              disabled={loading || saving}
            />
          </div>

          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>

          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
          {message && (
            <p className="text-xs text-green-600 mt-1">{message}</p>
          )}
        </form>

        <div className="rounded-lg border bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Pratinjau Peta
          </h2>
          {!hasCoords && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Masukkan latitude dan longitude untuk melihat pratinjau peta.
            </p>
          )}
          {hasCoords && mapSrc && (
            <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
              <iframe
                title="Lokasi Absensi"
                src={mapSrc}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            Tip: Buka Google Maps, klik kanan di lokasi kantor untuk menyalin
            koordinat, lalu tempelkan ke kolom latitude dan longitude di atas.
          </p>
        </div>
      </div>
    </div>
  );
}
