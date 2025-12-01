"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TodayInfo {
  dateLabel: string;
  shiftName: string;
  shiftTime: string;
  isDayOff: boolean;
  status:
    | "NO_SCHEDULE"
    | "DAY_OFF"
    | "NOT_CLOCKED_IN"
    | "CLOCKED_IN_ONLY"
    | "CLOCKED_OUT";
}

export default function MobileHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeCompanyId, setEmployeeCompanyId] = useState("");
  const [todayInfo, setTodayInfo] = useState<TodayInfo | null>(null);

  async function loadData(token: string) {
    try {
      setLoading(true);
      setLoadError(null);

      const headers = {
        Authorization: `Bearer ${token}`,
      } as HeadersInit;

      const [profileRes, scheduleRes] = await Promise.all([
        fetch("/api/mobile/me", { headers }),
        fetch(`/api/mobile/me/schedule`, { headers }),
      ]);

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => null);
        throw new Error(body?.message || "Gagal memuat profil");
      }
      if (!scheduleRes.ok) {
        const body = await scheduleRes.json().catch(() => null);
        throw new Error(body?.message || "Gagal memuat jadwal");
      }

      const profileData = await profileRes.json();
      const scheduleData = await scheduleRes.json();

      const employee = profileData.employee;
      setEmployeeName(employee?.name ?? "");
      setEmployeeCompanyId(employee?.companyId ?? "");

      const items: any[] = scheduleData.items ?? [];
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth(); // 0-based
      const todayDate = today.getDate();
      const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(
        todayDate
      ).padStart(2, "0")}`;

      const todayItem =
        items.find((item) => {
          try {
            const d = new Date(item.date);
            return (
              d.getFullYear() === todayYear &&
              d.getMonth() === todayMonth &&
              d.getDate() === todayDate
            );
          } catch {
            return String(item.date).slice(0, 10) === todayStr;
          }
        }) ?? null;

      let info: TodayInfo;
      if (!todayItem) {
        info = {
          dateLabel: todayStr,
          shiftName: "",
          shiftTime: "",
          isDayOff: false,
          status: "NO_SCHEDULE",
        };
      } else {
        const shift = todayItem.shift;
        const attendance = todayItem.attendance;

        let status: TodayInfo["status"];
        if (shift?.isDayOff) {
          status = "DAY_OFF";
        } else if (!attendance || (!attendance.timeIn && !attendance.timeOut)) {
          status = "NOT_CLOCKED_IN";
        } else if (attendance.timeIn && !attendance.timeOut) {
          status = "CLOCKED_IN_ONLY";
        } else if (attendance.timeIn && attendance.timeOut) {
          status = "CLOCKED_OUT";
        } else {
          status = "NOT_CLOCKED_IN";
        }

        info = {
          dateLabel: todayStr,
          shiftName: shift?.name ?? "",
          shiftTime: shift
            ? `${shift.startTime ?? ""} - ${shift.endTime ?? ""}`
            : "",
          isDayOff: !!shift?.isDayOff,
          status,
        };
      }

      setTodayInfo(info);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setLoadError(err?.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;

    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    loadData(token);
  }, [router]);

  async function doClockIn(lat?: number, lng?: number) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      setMessage(null);

      const res = await fetch("/api/mobile/me/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body:
          typeof lat === "number" && typeof lng === "number"
            ? JSON.stringify({ lat, lng })
            : JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal absen masuk");
      }

      setMessage(data?.message || "Absen masuk berhasil");
      await loadData(token);
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || "Gagal absen masuk");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClockIn() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setActionError(
        "Perangkat tidak mendukung atau mengizinkan akses lokasi. Aktifkan izin lokasi untuk browser lalu coba lagi."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void doClockIn(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error(err);
        setActionError(
          "Tidak dapat mengakses lokasi. Pastikan izin lokasi untuk browser sudah diizinkan, lalu coba lagi."
        );
      }
    );
  }

  async function handleClockOut() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("mobile_token") : null;
    if (!token) {
      router.replace("/mobile/login");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      setMessage(null);

      const res = await fetch("/api/mobile/me/clock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal absen keluar");
      }

      setMessage(data?.message || "Absen keluar berhasil");
      await loadData(token);
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || "Gagal absen keluar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8">
        <p className="text-sm text-zinc-600">Memuat...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-8 space-y-4">
        <p className="text-sm text-red-600">{loadError}</p>
        <button
          onClick={() => router.replace("/mobile/login")}
          className="rounded-md bg-primary text-white px-3 py-2 text-sm font-semibold"
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  const info = todayInfo;
  const canClockIn =
    info && info.status === "NOT_CLOCKED_IN" && !info.isDayOff && !submitting;
  const canClockOut =
    info && info.status === "CLOCKED_IN_ONLY" && !submitting;

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-16">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Selamat datang,</p>
        <h1 className="text-xl font-bold">{employeeName}</h1>
        {employeeCompanyId && (
          <p className="text-sm text-zinc-600">{employeeCompanyId}</p>
        )}
      </div>

      {/* Card hari ini */}
      <div className="rounded-2xl border border-primary bg-white shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold">
          Hari ini: {info?.dateLabel ?? "-"}
        </p>
        {info?.status === "NO_SCHEDULE" && (
          <p className="text-sm">Tidak ada jadwal untuk hari ini</p>
        )}
        {info?.status === "DAY_OFF" && (
          <p className="text-sm">
            Hari ini adalah hari libur{info.shiftName ? ` (${info.shiftName})` : ""}
          </p>
        )}
        {info && info.status !== "NO_SCHEDULE" && !info.isDayOff && (
          <>
            <p className="text-sm">Shift: {info.shiftName || "-"}</p>
            <p className="text-sm">Jam: {info.shiftTime || "-"}</p>
          </>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleClockIn}
            disabled={!canClockIn}
            className="flex-1 rounded-md bg-primary text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {submitting && canClockIn ? "Memproses..." : "Check In"}
          </button>
          <button
            type="button"
            onClick={handleClockOut}
            disabled={!canClockOut}
            className="flex-1 rounded-md bg-primary text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {submitting && canClockOut ? "Memproses..." : "Check Out"}
          </button>
        </div>

        {message && (
          <p className="mt-2 text-xs text-emerald-700">{message}</p>
        )}
        {actionError && (
          <p className="mt-1 text-xs text-red-600">{actionError}</p>
        )}
      </div>

      {/* Menu grid */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">Menu</p>
        <div className="grid grid-cols-4 gap-4 text-center text-xs">
          <button
            className="flex flex-col items-center gap-1"
            onClick={() => router.push("/mobile/schedule")}
          >
            <span className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center text-sm font-semibold">
              J
            </span>
            <span>Jadwal</span>
          </button>
          <button
            className="flex flex-col items-center gap-1"
            onClick={() => router.push("/mobile/history")}
          >
            <span className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center text-sm font-semibold">
              H
            </span>
            <span>Histori</span>
          </button>
          <button
            className="flex flex-col items-center gap-1"
            onClick={() => router.push("/mobile/payslips")}
          >
            <span className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center text-sm font-semibold">
              S
            </span>
            <span>Slip Gaji</span>
          </button>
          <button
            className="flex flex-col items-center gap-1"
            onClick={() => router.push("/mobile/requests")}
          >
            <span className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center text-sm font-semibold">
              R
            </span>
            <span>Request</span>
          </button>
          <button
            className="flex flex-col items-center gap-1"
            onClick={() => router.push("/mobile/profile")}
          >
            <span className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center text-sm font-semibold">
              P
            </span>
            <span>Profil</span>
          </button>
        </div>
      </div>

      <div className="mt-auto" />
    </div>
  );
}
