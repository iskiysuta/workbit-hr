"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeaveStatus, updateSwapStatus } from "./actions";

type LeaveActionButtonsProps = {
  id: number;
};

type SwapActionButtonsProps = {
  id: number;
};

export function LeaveActionButtons({ id }: LeaveActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      await updateLeaveStatus(id, action);
      router.refresh();
      if (typeof window !== "undefined") {
        window.alert(
          action === "approve"
            ? "Request izin/sakit berhasil di-approve"
            : "Request izin/sakit berhasil ditolak"
        );
      }
    });
  }

  return (
    <span className="inline-flex gap-2">
      <button
        type="button"
        onClick={() => handle("approve")}
        disabled={isPending}
        className="px-3 py-1 rounded-full bg-green-500 text-white text-xs hover:bg-green-600 disabled:opacity-60"
      >
        {isPending ? "Memproses..." : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => handle("reject")}
        disabled={isPending}
        className="px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 disabled:opacity-60"
      >
        Tolak
      </button>
    </span>
  );
}

export function SwapActionButtons({ id }: SwapActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      await updateSwapStatus(id, action);
      router.refresh();
      if (typeof window !== "undefined") {
        window.alert(
          action === "approve"
            ? "Request tukar shift berhasil di-approve"
            : "Request tukar shift berhasil ditolak"
        );
      }
    });
  }

  return (
    <span className="inline-flex gap-2">
      <button
        type="button"
        onClick={() => handle("approve")}
        disabled={isPending}
        className="px-3 py-1 rounded-full bg-green-500 text-white text-xs hover:bg-green-600 disabled:opacity-60"
      >
        {isPending ? "Memproses..." : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => handle("reject")}
        disabled={isPending}
        className="px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 disabled:opacity-60"
      >
        Tolak
      </button>
    </span>
  );
}
