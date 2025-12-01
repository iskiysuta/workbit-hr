import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeaveActionButtons, SwapActionButtons } from "./RequestActionButtons";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "swap" ? "swap" : "leave";

  const [leaveRequests, swapRequests] = await Promise.all([
    prisma.leaveRequest.findMany({
      include: {
        employee: { select: { id: true, name: true, companyId: true } },
        shift: true,
      },
      orderBy: [{ status: "asc" }, { date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.shiftSwapRequest.findMany({
      include: {
        requester: { select: { id: true, name: true, companyId: true } },
        target: { select: { id: true, name: true, companyId: true } },
      },
      orderBy: [{ status: "asc" }, { date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-orange-600">Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Kelola request dari karyawan: izin/sakit dan tukar shift.
        </p>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 text-xs font-medium">
        <Link
          href="/requests?tab=leave"
          className={`px-3 py-2 border-b-2 transition-colors ${
            tab === "leave"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Request Izin / Sakit
        </Link>
        <Link
          href="/requests?tab=swap"
          className={`px-3 py-2 border-b-2 transition-colors ${
            tab === "swap"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Request Tukar Shift
        </Link>
      </div>

      {tab === "leave" ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-orange-100">
          <table className="min-w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-4 py-2 text-left">Karyawan</th>
                <th className="px-4 py-2 text-left">Tanggal</th>
                <th className="px-4 py-2 text-left">Shift Tujuan</th>
                <th className="px-4 py-2 text-left">Alasan</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-500" colSpan={6}>
                    Belum ada request izin/sakit.
                  </td>
                </tr>
              ) : (
                leaveRequests.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <div className="font-medium">{r.employee.name}</div>
                      <div className="text-xs text-gray-500">{r.employee.companyId}</div>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2">{r.shift.name}</td>
                    <td className="px-4 py-2 max-w-xs break-words">
                      {r.reason || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {r.status === "PENDING" ? (
                        <LeaveActionButtons id={r.id} />
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada aksi</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-orange-100">
          <table className="min-w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-4 py-2 text-left">Requester</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-left">Tanggal</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {swapRequests.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-500" colSpan={5}>
                    Belum ada request tukar shift.
                  </td>
                </tr>
              ) : (
                swapRequests.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <div className="font-medium">{r.requester.name}</div>
                      <div className="text-xs text-gray-500">
                        {r.requester.companyId}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{r.target.name}</div>
                      <div className="text-xs text-gray-500">{r.target.companyId}</div>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {r.status === "PENDING" ? (
                        <SwapActionButtons id={r.id} />
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada aksi</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
