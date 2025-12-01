"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Employee = {
  id: number;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  position: string;
  level: string;
};

type SortKey = "companyId" | "name" | "email" | "phone" | "position" | "joinedAt";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/employees");
        if (!res.ok) {
          throw new Error("Gagal mengambil data karyawan");
        }
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        setError("Tidak dapat memuat data karyawan");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Import gagal");
      } else {
        setImportMessage(data.message || "Import berhasil");
        // reload list
        const listRes = await fetch("/api/employees");
        if (listRes.ok) {
          const listData = await listRes.json();
          setEmployees(listData);
        }
      }
    } catch {
      setError("Terjadi kesalahan saat import file");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function handleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  const sortedEmployees = useMemo(() => {
    if (!sort) return employees;
    const { key, direction } = sort;
    const factor = direction === "asc" ? 1 : -1;
    return [...employees].sort((a, b) => {
      let av: string | number = a[key];
      let bv: string | number = b[key];

      if (key === "joinedAt") {
        const ad = new Date(a.joinedAt).getTime();
        const bd = new Date(b.joinedAt).getTime();
        return (ad - bd) * factor;
      }

      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [employees, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Karyawan</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Kelola data karyawan perusahaan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
          >
            Import XLSX
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportChange}
          />
          <Link
            href="/employees/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Tambah Karyawan
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {importMessage && (
        <p className="text-sm text-green-600">{importMessage}</p>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm dark:border-zinc-800">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("companyId")}
                >
                  ID Perusahaan
                </th>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  Nama
                </th>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("email")}
                >
                  Email
                </th>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("phone")}
                >
                  No HP
                </th>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("position")}
                >
                  Jabatan
                </th>
                <th
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort("joinedAt")}
                >
                  Tanggal Bergabung
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={6}>
                    Memuat data...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-zinc-500" colSpan={6}>
                    Belum ada data karyawan.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    className="cursor-pointer border-t border-border/60 hover:bg-muted/60"
                  >
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {emp.companyId}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                      {emp.name}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {emp.email}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {emp.phone}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {emp.position}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                      {new Date(emp.joinedAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
