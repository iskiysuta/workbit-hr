"use client";

import { useRouter } from "next/navigation";

export default function MobileRequestsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-primary">Request</h1>
        <p className="text-xs text-zinc-600">
          Menu untuk pengajuan izin/cuti/sakit dan tukar shift.
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <button
          type="button"
          className="w-full rounded-2xl border border-primary/60 bg-white p-4 text-left space-y-1"
          onClick={() => router.push("/mobile/requests/leave")}
        >
          <p className="font-semibold text-zinc-900">Request Izin / Cuti / Sakit</p>
          <p className="text-xs text-zinc-600">
            Ajukan izin, cuti, atau sakit ke atasan.
          </p>
        </button>

        <button
          type="button"
          className="w-full rounded-2xl border border-primary/60 bg-white p-4 text-left space-y-1"
          onClick={() => router.push("/mobile/requests/shift-swap")}
        >
          <p className="font-semibold text-zinc-900">Request Tukar Shift</p>
          <p className="text-xs text-zinc-600">
            Ajukan permintaan tukar shift dengan rekan kerja.
          </p>
        </button>
      </div>

      <div className="mt-auto flex justify-end pt-4">
        <button
          type="button"
          onClick={() => router.replace("/mobile")}
          className="text-xs text-primary underline"
        >
          Kembali ke beranda
        </button>
      </div>
    </div>
  );
}
