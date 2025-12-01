"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  name: string;
  companyId: string;
};

type EmployeeLoan = {
  id: number;
  employeeId: number;
  loanDate: string;
  amount: number;
  months: number;
  installment: number;
  description: string | null;
  isActive: boolean;
  employee?: Employee;
  paidMonths?: number;
};

type ActiveTab = "loan" | "payroll" | "history";

type PayrollPreviewRow = {
  employeeId: number;
  companyId: string;
  name: string;
  jobLevel: string | null;
  jobTitle: string | null;
  totalSalary: number;
  isFullSalaryPayroll: boolean;
  scheduledWorkingDays: number;
  workingDays: number;
  offDays: number;
  absentDays: number;
  lateCount: number;
  totalLateMinutes: number;
  totalWorkMinutes: number;
  loanInstallment: number;
  baseSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  healthAllowance: number;
  grossBeforePenalty: number;
  latePenalty: number;
};

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("loan");

  // base data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<EmployeeLoan[]>([]);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loanDate, setLoanDate] = useState("");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("");
  const [installment, setInstallment] = useState("");
  const [description, setDescription] = useState("");
  const [savingLoan, setSavingLoan] = useState(false);

  // edit modal
  const [editingLoan, setEditingLoan] = useState<EmployeeLoan | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMonths, setEditMonths] = useState("");
  const [editInstallment, setEditInstallment] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // loan detail modal
  const [detailLoan, setDetailLoan] = useState<any | null>(null);
  const [loadingLoanDetail, setLoadingLoanDetail] = useState(false);
  const [loanDetailError, setLoanDetailError] = useState<string | null>(null);

  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // payroll tab
  const [payrollMonth, setPayrollMonth] = useState("");
  const [payrollRows, setPayrollRows] = useState<PayrollPreviewRow[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);
  const [manualAdjustments, setManualAdjustments] = useState<
    Record<
      number,
      {
        extraDeduction: number;
        extraAddition: number;
      }
    >
  >({});

  // history tab
  const [historyPeriods, setHistoryPeriods] = useState<
    Array<{
      id: number;
      year: number;
      month: number;
      periodStart: string;
      periodEnd: string;
      createdAt: string;
      itemCount: number;
    }>
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedPeriodDetail, setSelectedPeriodDetail] = useState<any | null>(
    null
  );
  const [loadingPeriodDetail, setLoadingPeriodDetail] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEmployees(
          data.map((e: any) => ({
            id: e.id,
            name: e.name,
            companyId: e.companyId,
          }))
        );
      } catch {
        setError("Tidak dapat memuat data karyawan");
      } finally {
        setLoadingEmployees(false);
      }
    }

    async function loadLoans() {
      try {
        const res = await fetch("/api/employee-loans");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLoans(data);
      } catch {
        setError("Tidak dapat memuat data pinjaman karyawan");
      } finally {
        setLoadingLoans(false);
      }
    }

    loadEmployees();
    loadLoans();
  }, []);

  useEffect(() => {
    // default payroll month = current month
    if (!payrollMonth) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      setPayrollMonth(ym);
    }
  }, [payrollMonth]);

  const displayedLoans = useMemo(() => {
    return loans.slice().sort((a, b) => b.id - a.id);
  }, [loans]);

  useEffect(() => {
    // hitung default installment ketika amount & months ada dan installment belum diisi manual
    if (!amount || !months) {
      setInstallment("");
      return;
    }
    const cleanedAmount = amount.replace(/\D/g, "");
    const amt = Number(cleanedAmount);
    const m = Number(months);
    if (Number.isNaN(amt) || Number.isNaN(m) || m <= 0) {
      setInstallment("");
      return;
    }
    const auto = Math.floor(amt / m);
    setInstallment(String(auto));
  }, [amount, months]);

  async function handleCreateLoan(e: React.FormEvent) {
    e.preventDefault();
    setSavingLoan(true);
    setError(null);
    try {
      const cleanedAmount = amount.replace(/\D/g, "");
      const amountNumber = cleanedAmount ? Number(cleanedAmount) : null;
      const res = await fetch("/api/employee-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : null,
          loanDate,
          amount: amountNumber,
          months: months ? Number(months) : null,
          installment: installment ? Number(installment) : null,
          description: description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan pinjaman");
        return;
      }
      // reload list
      setLoans((prev) => [data, ...prev]);
      setSelectedEmployeeId("");
      setLoanDate("");
      setAmount("");
      setMonths("");
      setInstallment("");
      setDescription("");
    } catch {
      setError("Terjadi kesalahan saat menyimpan pinjaman");
    } finally {
      setSavingLoan(false);
    }
  }

  function openEditModal(loan: EmployeeLoan) {
    setEditingLoan(loan);
    setEditAmount(String(loan.amount));
    setEditMonths(String(loan.months));
    setEditInstallment(String(loan.installment));
    setEditDescription(loan.description ?? "");
    setEditIsActive(loan.isActive);
  }

  async function handleUpdateLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLoan) return;
    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/employee-loans/${editingLoan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editAmount ? Number(editAmount) : null,
          months: editMonths ? Number(editMonths) : null,
          installment: editInstallment ? Number(editInstallment) : null,
          description: editDescription || null,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal memperbarui pinjaman");
        return;
      }
      setLoans((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      setEditingLoan(null);
    } catch {
      setError("Terjadi kesalahan saat memperbarui pinjaman");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteLoan(id: number) {
    if (!confirm("Yakin ingin menghapus pinjaman ini?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/employee-loans/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Gagal menghapus pinjaman");
        return;
      }
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Terjadi kesalahan saat menghapus pinjaman");
    } finally {
      setDeletingId(null);
    }
  }

  async function openLoanDetailModal(id: number) {
    setDetailLoan(null);
    setLoanDetailError(null);
    setLoadingLoanDetail(true);
    try {
      const res = await fetch(`/api/employee-loans/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setLoanDetailError(data.message || "Gagal memuat detail pinjaman");
        return;
      }
      setDetailLoan(data);
    } catch {
      setLoanDetailError("Terjadi kesalahan saat memuat detail pinjaman");
    } finally {
      setLoadingLoanDetail(false);
    }
  }

  function getAdjustmentFor(employeeId: number) {
    return (
      manualAdjustments[employeeId] || { extraDeduction: 0, extraAddition: 0 }
    );
  }

  function handleChangeAdjustment(
    employeeId: number,
    field: "extraDeduction" | "extraAddition",
    value: string
  ) {
    const num = Number(value || 0);
    setManualAdjustments((prev) => ({
      ...prev,
      [employeeId]: {
        ...getAdjustmentFor(employeeId),
        [field]: Number.isNaN(num) ? 0 : num,
      },
    }));
  }

  async function loadPayroll(month: string) {
    if (!month) return;
    setLoadingPayroll(true);
    setPayrollError(null);
    try {
      const params = new URLSearchParams({ month });
      const res = await fetch(`/api/payroll/preview?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setPayrollError(data.message || "Gagal memuat data payroll");
        setPayrollRows([]);
        return;
      }
      setPayrollRows(data as PayrollPreviewRow[]);
    } catch {
      setPayrollError("Terjadi kesalahan saat memuat data payroll");
      setPayrollRows([]);
    } finally {
      setLoadingPayroll(false);
    }
  }

  async function handleProcessPayroll() {
    if (!payrollMonth) {
      setPayrollError("Bulan payroll wajib dipilih");
      return;
    }
    if (payrollRows.length === 0) {
      setPayrollError("Tidak ada data payroll untuk diproses");
      return;
    }

    setProcessingPayroll(true);
    setProcessMessage(null);
    setPayrollError(null);
    try {
      const adjustmentsPayload = Object.entries(manualAdjustments).map(
        ([employeeId, adj]) => ({
          employeeId: Number(employeeId),
          extraDeduction: adj.extraDeduction || 0,
          extraAddition: adj.extraAddition || 0,
        })
      );

      const res = await fetch("/api/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payrollMonth,
          adjustments: adjustmentsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayrollError(data.message || "Gagal memproses payroll");
        return;
      }
      setProcessMessage(
        data.message || "Payroll berhasil diproses dan periode dikunci"
      );
      // refresh history list agar periode baru muncul
      await loadHistory();
    } catch {
      setPayrollError("Terjadi kesalahan saat memproses payroll");
    } finally {
      setProcessingPayroll(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch("/api/payroll/history");
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data.message || "Gagal memuat riwayat payroll");
        setHistoryPeriods([]);
        return;
      }
      setHistoryPeriods(data);
    } catch {
      setHistoryError("Terjadi kesalahan saat memuat riwayat payroll");
      setHistoryPeriods([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadPeriodDetail(id: number) {
    setSelectedPeriodId(id);
    setSelectedPeriodDetail(null);
    setLoadingPeriodDetail(true);
    try {
      const res = await fetch(`/api/payroll/history/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data.message || "Gagal memuat detail payroll");
        return;
      }
      setSelectedPeriodDetail(data);
    } catch {
      setHistoryError("Terjadi kesalahan saat memuat detail payroll");
    } finally {
      setLoadingPeriodDetail(false);
    }
  }

  async function handleUnlockPeriod(id: number) {
    if (!confirm("Yakin ingin menghapus (unlock) periode payroll ini?")) return;
    try {
      const res = await fetch(`/api/payroll/history/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data.message || "Gagal menghapus periode payroll");
        return;
      }
      setHistoryPeriods((prev) => prev.filter((p) => p.id !== id));
      if (selectedPeriodId === id) {
        setSelectedPeriodId(null);
        setSelectedPeriodDetail(null);
      }
    } catch {
      setHistoryError("Terjadi kesalahan saat menghapus periode payroll");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Payroll
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Kelola pinjaman karyawan dan perhitungan gaji bulanan.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border/60 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("loan")}
          className={`rounded-t-md px-3 py-2 transition-colors ${
            activeTab === "loan"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Pinjaman Karyawan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={`rounded-t-md px-3 py-2 transition-colors ${
            activeTab === "payroll"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Payroll
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`rounded-t-md px-3 py-2 transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Riwayat Payroll
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {activeTab === "loan" && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Pinjaman Karyawan
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Catat dan kelola pinjaman karyawan. Data ini akan dipakai saat
                perhitungan payroll.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoanModalOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
           >
              Tambah Pinjaman
            </button>
          </div>

          <div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Karyawan</th>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Jumlah Pinjaman</th>
                    <th className="px-4 py-2">Bulan</th>
                    <th className="px-4 py-2">Cicilan/Bulan</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Keterangan</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingLoans ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={8}
                      >
                        Memuat data pinjaman...
                      </td>
                    </tr>
                  ) : displayedLoans.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-zinc-500"
                        colSpan={8}
                      >
                        Belum ada data pinjaman.
                      </td>
                    </tr>
                  ) : (
                    displayedLoans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                          {loan.employee
                            ? `${loan.employee.companyId} - ${loan.employee.name}`
                            : loan.employeeId}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {new Date(loan.loanDate).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {loan.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {loan.months}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {loan.installment.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-2 align-middle text-[11px]">
                          {loan.isActive ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              Lunas / Tidak Aktif
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                          {loan.description || "-"}
                        </td>
                        <td className="px-4 py-2 align-middle text-right text-xs">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openLoanDetailModal(loan.id)}
                              className="rounded-md border border-input px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(loan)}
                              className="rounded-md border border-input px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLoan(loan.id)}
                              disabled={deletingId === loan.id}
                              className="rounded-md border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                            >
                              {deletingId === loan.id ? "Menghapus..." : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {loanModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-2xl rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Tambah Pinjaman</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Isi informasi pinjaman karyawan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoanModalOpen(false)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Tutup
                  </button>
                </div>
                <form onSubmit={handleCreateLoan} className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Karyawan
                      </label>
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        required
                      >
                        <option value="">Pilih karyawan</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{`
                            ${emp.companyId} - ${emp.name}
                          `}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Tanggal Peminjaman
                      </label>
                      <input
                        type="date"
                        value={loanDate}
                        onChange={(e) => setLoanDate(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Jumlah Pinjaman
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Dibayar Berapa Kali (bulan)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={months}
                        onChange={(e) => setMonths(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Jumlah Cicilan per Bulan
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={installment}
                        readOnly
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Keterangan (opsional)
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                        placeholder="Mis. pinjaman pribadi, kasbon, dll"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoanModalOpen(false)}
                      className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingLoan || loadingEmployees}
                      className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                      {savingLoan ? "Menyimpan..." : "Simpan Pinjaman"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {detailLoan && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-3xl rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Detail Pinjaman</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Riwayat pembayaran pinjaman lewat proses payroll.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailLoan(null);
                      setLoanDetailError(null);
                    }}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Tutup
                  </button>
                </div>

                {loadingLoanDetail ? (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Memuat detail pinjaman...
                  </p>
                ) : loanDetailError ? (
                  <p className="text-xs text-red-600">{loanDetailError}</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-800 dark:text-zinc-100">
                          {detailLoan.employee.companyId} - {detailLoan.employee.name}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Tanggal pinjam:{" "}
                          {new Date(detailLoan.loanDate).toLocaleDateString("id-ID")}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Keterangan: {detailLoan.description || "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-700 dark:text-zinc-200">
                          Ringkasan Pinjaman
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Total pinjaman: {detailLoan.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Tenor: {detailLoan.months} bulan
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Cicilan / bulan: {detailLoan.installment.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-700 dark:text-zinc-200">
                          Status Pembayaran
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Sudah dibayar: {detailLoan.paidMonths ?? 0} bulan
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Sisa bulan: {Math.max(0, detailLoan.months - (detailLoan.paidMonths ?? 0))}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Status: {detailLoan.isActive ? "Aktif" : "Lunas / Tidak Aktif"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                        Histori Pembayaran (via Payroll)
                      </p>
                      {detailLoan.payments && detailLoan.payments.length > 0 ? (
                        <div className="max-h-56 w-full overflow-x-auto rounded-md border border-border/60">
                          <table className="min-w-full text-left text-[11px]">
                            <thead className="bg-muted/60 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <tr>
                                <th className="px-3 py-1">Periode</th>
                                <th className="px-3 py-1">Rentang Tanggal</th>
                                <th className="px-3 py-1">Diproses Pada</th>
                                <th className="px-3 py-1 text-right">Jumlah Bayar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {detailLoan.payments.map((p: any) => {
                                const pp = p.payrollPeriod;
                                const label = `${String(pp.month).padStart(2, "0")}/${pp.year}`;
                                const range = `${new Date(pp.periodStart).toLocaleDateString(
                                  "id-ID"
                                )} - ${new Date(pp.periodEnd).toLocaleDateString("id-ID")}`;
                                const created = new Date(pp.createdAt).toLocaleString("id-ID");
                                return (
                                  <tr key={p.id}>
                                    <td className="px-3 py-1 align-middle text-zinc-700 dark:text-zinc-200">
                                      {label}
                                    </td>
                                    <td className="px-3 py-1 align-middle text-zinc-700 dark:text-zinc-200">
                                      {range}
                                    </td>
                                    <td className="px-3 py-1 align-middle text-zinc-700 dark:text-zinc-200">
                                      {created}
                                    </td>
                                    <td className="px-3 py-1 align-middle text-right text-zinc-700 dark:text-zinc-200">
                                      {p.amount.toLocaleString("id-ID")}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          Belum ada pembayaran pinjaman melalui proses payroll.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {editingLoan && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-md rounded-lg border bg-card p-4 text-sm shadow-lg dark:border-zinc-800">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Edit Pinjaman</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Sesuaikan jumlah pinjaman, bulan, dan cicilan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLoan(null)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Tutup
                  </button>
                </div>
                <form onSubmit={handleUpdateLoan} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Jumlah Pinjaman
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Dibayar Berapa Kali (bulan)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editMonths}
                      onChange={(e) => setEditMonths(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Jumlah Cicilan per Bulan
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editInstallment}
                      onChange={(e) => setEditInstallment(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      Keterangan (opsional)
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="edit-active"
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="h-3 w-3 rounded border-input text-primary focus:ring-1 focus:ring-ring"
                    />
                    <label
                      htmlFor="edit-active"
                      className="text-xs text-zinc-700 dark:text-zinc-200"
                    >
                      Pinjaman masih aktif
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingLoan(null)}
                      className="rounded-md border border-input px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                      {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "payroll" && (
        <>
          <div className="space-y-3 rounded-lg bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Bulan Payroll (periode 26 bulan sebelumnya s/d 25 bulan ini)
                </label>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => {
                    setPayrollMonth(e.target.value);
                    loadPayroll(e.target.value);
                  }}
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                />
              </div>
              <button
                type="button"
                onClick={() => loadPayroll(payrollMonth)}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                Hitung Payroll
              </button>
            </div>
            {payrollError && (
              <p className="text-sm text-red-600">{payrollError}</p>
            )}
            {processMessage && (
              <p className="text-sm text-emerald-600">{processMessage}</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                disabled={processingPayroll || loadingPayroll || payrollRows.length === 0}
                onClick={handleProcessPayroll}
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-emerald-50 shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {processingPayroll ? "Memproses..." : "Proses Payroll (Lock)"}
              </button>
            </div>

            {loadingPayroll ? (
              <p className="rounded-lg bg-card p-4 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
                Menghitung payroll...
              </p>
            ) : payrollRows.length === 0 ? (
              <p className="rounded-lg bg-card p-4 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
                Belum ada data payroll untuk periode ini.
              </p>
            ) : (
              <div className="space-y-3">
                {payrollRows.map((row) => {
                  const adj = getAdjustmentFor(row.employeeId);
                  const baseGross = row.isFullSalaryPayroll
                    ? row.totalSalary
                    : row.grossBeforePenalty;
                  const baseNet = baseGross - row.latePenalty;
                  const thp =
                    baseNet - row.loanInstallment - adj.extraDeduction + adj.extraAddition;

                  return (
                    <div
                      key={row.employeeId}
                      className="space-y-3 rounded-lg bg-card p-4 text-xs shadow-sm ring-1 ring-border/60 dark:ring-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {row.companyId} - {row.name}
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {row.jobTitle || "-"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            row.isFullSalaryPayroll
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {row.isFullSalaryPayroll ? "Full Salary" : "Normal"}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                            Kehadiran Periode
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            HK (hadir): {row.workingDays} hari
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            Jadwal kerja: {row.scheduledWorkingDays} hari
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            Libur: {row.offDays} hari, Tidak masuk: {row.absentDays} hari
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            Terlambat: {row.lateCount}x ({row.totalLateMinutes} menit)
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                            Komponen Gaji
                          </p>
                          <table className="w-full text-[11px] text-zinc-600 dark:text-zinc-400">
                            <tbody>
                              <tr>
                                <td className="pr-2 align-top">Total gaji</td>
                                <td className="text-right">{row.totalSalary.toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">GP (56%)</td>
                                <td className="text-right">{Math.round(row.baseSalary).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Tjab (15%)</td>
                                <td className="text-right">{Math.round(row.positionAllowance).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Ttrans (10%)</td>
                                <td className="text-right">{Math.round(row.transportAllowance).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Tmakan (14%)</td>
                                <td className="text-right">{Math.round(row.mealAllowance).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Tkes (5%)</td>
                                <td className="text-right">{Math.round(row.healthAllowance).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Pinjaman (cicilan)</td>
                                <td className="text-right">{row.loanInstallment.toLocaleString("id-ID")}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                            Perhitungan THP
                          </p>
                          <table className="w-full text-[11px] text-zinc-600 dark:text-zinc-400">
                            <tbody>
                              <tr>
                                <td className="pr-2 align-top">Gross sebelum pot. telat</td>
                                <td className="text-right">{Math.round(baseGross).toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Pot. telat</td>
                                <td className="text-right">
                                  {row.isFullSalaryPayroll
                                    ? "-"
                                    : Math.round(row.latePenalty).toLocaleString("id-ID")}
                                </td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Pot. pinjaman</td>
                                <td className="text-right">{row.loanInstallment.toLocaleString("id-ID")}</td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Potongan lain</td>
                                <td className="text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    value={adj.extraDeduction}
                                    onChange={(e) =>
                                      handleChangeAdjustment(
                                        row.employeeId,
                                        "extraDeduction",
                                        e.target.value
                                      )
                                    }
                                    className="w-28 rounded-md border border-input bg-white px-2 py-1 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="pr-2 align-top">Tambahan lain</td>
                                <td className="text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    value={adj.extraAddition}
                                    onChange={(e) =>
                                      handleChangeAdjustment(
                                        row.employeeId,
                                        "extraAddition",
                                        e.target.value
                                      )
                                    }
                                    className="w-28 rounded-md border border-input bg-white px-2 py-1 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-950"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="pt-2 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        THP: {isNaN(thp)
                          ? "-"
                          : Math.round(thp).toLocaleString("id-ID")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <>
          <div className="space-y-3 rounded-lg bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Riwayat Payroll
              </h2>
              <button
                type="button"
                onClick={loadHistory}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                Muat Riwayat
              </button>
            </div>
            {historyError && (
              <p className="text-sm text-red-600">{historyError}</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
            {loadingHistory ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Memuat riwayat payroll...
              </p>
            ) : historyPeriods.length === 0 ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Belum ada periode payroll yang diproses.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Periode</th>
                      <th className="px-4 py-2">Rentang Tanggal</th>
                      <th className="px-4 py-2">Diproses Pada</th>
                      <th className="px-4 py-2">Jumlah Karyawan</th>
                      <th className="px-4 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {historyPeriods.map((p) => {
                      const label = `${p.month.toString().padStart(2, "0")}/${p.year}`;
                      const range = `${new Date(p.periodStart).toLocaleDateString(
                        "id-ID"
                      )} - ${new Date(p.periodEnd).toLocaleDateString("id-ID")}`;
                      const created = new Date(p.createdAt).toLocaleString(
                        "id-ID"
                      );
                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-800 dark:text-zinc-100">
                            {label}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {range}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {created}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-zinc-700 dark:text-zinc-200">
                            {p.itemCount}
                          </td>
                          <td className="px-4 py-2 align-middle text-right text-xs">
                            <div className="flex justify-end gap-2">
                              <a
                                href={`/payroll/history/${p.id}`}
                                className="rounded-md border border-input px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Detail
                              </a>
                              <button
                                type="button"
                                onClick={() => handleUnlockPeriod(p.id)}
                                className="rounded-md border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                              >
                                Unlock
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedPeriodId && (
            <div className="space-y-3 rounded-lg bg-card p-4 text-sm shadow-sm ring-1 ring-border/60 dark:ring-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Detail Payroll Periode
              </h3>
              {loadingPeriodDetail || !selectedPeriodDetail ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Memuat detail payroll...
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPeriodDetail.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-lg bg-background p-3 text-xs shadow-sm ring-1 ring-border/60 dark:ring-zinc-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {item.employee.companyId} - {item.employee.name}
                          </p>
                        </div>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          THP: {item.thp.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        HK: {item.workingDays} | Terlambat: {item.lateCount}x ({
                          item.totalLateMinutes
                        }{" "}
                        menit) | Pinjaman: {item.loanInstallment.toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
