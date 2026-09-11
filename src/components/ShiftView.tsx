"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DollarSign,
  FileText,
  Plus,
  Printer,
  Wallet,
  Clock,
  ArrowDownCircle,
  Receipt,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { db } from "@/lib/db";
import { DEFAULT_STORE } from "@/lib/seed";
import { makeZReport } from "@/lib/reports.mjs";
import { generateZReportPdf, printDirectZReport } from "@/lib/zreport-engine";

export default function ShiftView() {
  const [openingInput, setOpeningInput] = useState("100000");
  const [closingInput, setClosingInput] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseSource, setExpenseSource] = useState<"laci" | "owner">("laci");

  const currentShift = useLiveQuery(() => db.shifts.where("status").equals("open").first(), [], null);
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), [], []);
  const debtLedgers = useLiveQuery(() => db.debtLedgers.where("type").equals("repayment").toArray(), [], []);

  const shiftTransactions = useMemo(() => {
    if (!currentShift) return [];
    return transactions.filter((t) => t.timestamp >= currentShift.startTime);
  }, [transactions, currentShift]);

  const shiftExpenses = useMemo(() => {
    if (!currentShift) return [];
    return expenses.filter((e) => e.timestamp >= currentShift.startTime);
  }, [expenses, currentShift]);

  const shiftDebtRepayments = useMemo(() => {
    if (!currentShift) return 0;
    return debtLedgers
      .filter((d) => d.timestamp >= currentShift.startTime)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debtLedgers, currentShift]);

  const zReport = useMemo(() => {
    if (!currentShift) return null;
    return makeZReport({
      shift: {
        ...currentShift,
        closingCashActual: closingInput ? Number(closingInput) : undefined,
      },
      transactions: shiftTransactions,
      expenses: shiftExpenses,
      debtPayments: shiftDebtRepayments,
    });
  }, [currentShift, closingInput, shiftTransactions, shiftExpenses, shiftDebtRepayments]);

  const handleStartShift = async () => {
    const opening = Math.max(0, Number(openingInput) || 0);
    await db.transaction("rw", [db.shifts], async () => {
      const existingOpen = await db.shifts.where("status").equals("open").first();
      if (existingOpen) {
        alert("Masih ada shift kasir yang belum ditutup!");
        return;
      }
      await db.shifts.add({
        id: `SHIFT-${Date.now()}`,
        cashierName: "Kasir",
        startTime: Date.now(),
        openingCash: opening,
        cashSales: 0,
        nonCashSales: 0,
        debtIssued: 0,
        debtCollected: 0,
        expensesPaid: 0,
        expectedCash: opening,
        cashDifference: 0,
        status: "open",
      });
    });
  };

  const handleAddExpense = async () => {
    const amount = Number(expenseAmount);
    if (!amount || !expenseDesc.trim()) return;
    await db.expenses.add({
      id: crypto.randomUUID(),
      category: "Operasional Warung",
      description: expenseDesc.trim(),
      amount,
      source: expenseSource,
      cashierName: "Kasir",
      shiftId: currentShift?.id,
      timestamp: Date.now(),
    });
    setExpenseDesc("");
    setExpenseAmount("");
  };

  const handleCloseShift = async () => {
    if (!currentShift || !zReport) return;
    const actual = Number(closingInput) || 0;
    const diff = actual - zReport.expectedCash;

    await db.shifts.update(currentShift.id, {
      endTime: Date.now(),
      closingCashActual: actual,
      cashSales: zReport.cash,
      nonCashSales: zReport.qris + zReport.transfer,
      debtIssued: zReport.kasbon,
      debtCollected: shiftDebtRepayments,
      expensesPaid: zReport.expenses,
      expectedCash: zReport.expectedCash,
      cashDifference: diff,
      status: "closed",
    });

    const reportData = {
      shiftId: currentShift.id,
      cashierName: currentShift.cashierName,
      startTime: currentShift.startTime,
      endTime: Date.now(),
      openingCash: currentShift.openingCash,
      cashSales: zReport.cash,
      qrisSales: zReport.qris,
      transferSales: zReport.transfer,
      debtIssued: zReport.kasbon,
      debtCollected: shiftDebtRepayments,
      expensesPaid: zReport.expenses,
      expectedCash: zReport.expectedCash,
      actualCash: actual,
      difference: diff,
      transactionCount: zReport.transactions,
    };

    try {
      await printDirectZReport(reportData, DEFAULT_STORE, 58);
    } catch {
      // Ignored if direct print not connected
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="border-b border-[var(--line)] pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">Shift & Arus Kas Laci (Petty Cash)</h2>
        <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Kontrol modal awal kasir, pengeluaran darurat warung, dan tutup buku harian (Laporan Z).</p>
      </div>

      {!currentShift ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[var(--ink)]">Buka Shift Kasir Baru</h3>
              <p className="text-xs text-[var(--muted)]">Masukkan uang modal awal di laci kasir pagi ini.</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] block mb-1">Uang Modal Awal Laci (Rp):</label>
            <input
              type="number"
              value={openingInput}
              onChange={(e) => setOpeningInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-sm font-bold tabular outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
            />
          </div>

          <button
            onClick={handleStartShift}
            className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] py-3 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
          >
            Mulai Shift Sekarang
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Petty Cash Out Form */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[var(--line-soft)] pb-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/15 text-rose-600">
                <ArrowDownCircle size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[var(--ink)]">Catat Pengeluaran Kasir (Petty Cash)</h3>
                <p className="text-xs text-[var(--muted)]">Beli es batu, galon, bumbu dapur, plastik, dll.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Keperluan Pengeluaran:</label>
                <input
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Contoh: Es batu kristal 2 bal"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="15000"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs font-bold tabular outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Sumber Uang:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseSource("laci")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-bold cursor-pointer transition-all ${
                      expenseSource === "laci"
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                        : "border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    Dari Laci Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseSource("owner")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-bold cursor-pointer transition-all ${
                      expenseSource === "owner"
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                        : "border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    Uang Pribadi Owner
                  </button>
                </div>
              </div>

              <button
                disabled={!expenseAmount || !expenseDesc.trim()}
                onClick={handleAddExpense}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[var(--ink)] hover:opacity-90 py-2.5 text-xs font-extrabold text-white transition-all disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} /> Catat Pengeluaran
              </button>
            </div>

            {/* List of expenses this shift */}
            <div className="border-t border-[var(--line-soft)] pt-3">
              <h4 className="text-xs font-extrabold text-[var(--muted)] uppercase tracking-wider mb-2">Riwayat Pengeluaran Shift:</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {shiftExpenses.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-3">Belum ada catatan pengeluaran di shift ini.</p>
                ) : (
                  shiftExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-xs">
                      <div>
                        <p className="font-bold text-[var(--ink)]">{exp.description}</p>
                        <span className="text-[10px] text-[var(--muted)]">Sumber: {exp.source === "laci" ? "Laci Kasir" : "Pribadi Owner"}</span>
                      </div>
                      <span className="font-black text-[var(--danger)] tabular">- Rp {exp.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Shift Summary & Z-Report Close */}
          {zReport && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-600">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[var(--ink)]">Rekap Kasir & Tutup Shift</h3>
                    <p className="text-[10px] text-[var(--muted)]">Shift ID: {currentShift.id}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Aktif
                </span>
              </div>

              <div className="space-y-1.5 text-xs rounded-xl bg-[var(--surface-2)]/60 p-3 border border-[var(--line-soft)]">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Modal Awal:</span>
                  <span className="font-bold tabular text-[var(--ink)]">Rp {zReport.openingCash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Penjualan Tunai:</span>
                  <span className="font-bold tabular text-[var(--ink)]">+ Rp {zReport.cash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Pelunasan Kasbon Tunai:</span>
                  <span className="font-bold tabular text-[var(--ink)]">+ Rp {shiftDebtRepayments.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Pengeluaran Laci:</span>
                  <span className="font-bold tabular text-[var(--danger)]">- Rp {zReport.expenses.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-2 font-black text-sm text-[var(--ink)]">
                  <span>Uang Seharusnya di Laci:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular">Rp {zReport.expectedCash.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[var(--muted)] block">Hitung Uang Fisik Nyata di Laci (Rp):</label>
                <input
                  type="number"
                  value={closingInput}
                  onChange={(e) => setClosingInput(e.target.value)}
                  placeholder="Masukkan total uang cash fisik..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-center text-lg font-black tabular outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              {closingInput && (
                <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                  Number(closingInput) - zReport.expectedCash === 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                }`}>
                  <span>Selisih Fisik vs Sistem:</span>
                  <span className="text-sm font-black tabular">
                    {Number(closingInput) - zReport.expectedCash >= 0 ? "+" : ""}
                    Rp {(Number(closingInput) - zReport.expectedCash).toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line-soft)]">
                <button
                  type="button"
                  onClick={() => printDirectZReport({
                    shiftId: currentShift.id,
                    cashierName: currentShift.cashierName,
                    startTime: currentShift.startTime,
                    endTime: Date.now(),
                    openingCash: currentShift.openingCash,
                    cashSales: zReport.cash,
                    qrisSales: zReport.qris,
                    transferSales: zReport.transfer,
                    debtIssued: zReport.kasbon,
                    debtCollected: shiftDebtRepayments,
                    expensesPaid: zReport.expenses,
                    expectedCash: zReport.expectedCash,
                    actualCash: Number(closingInput) || zReport.expectedCash,
                    difference: (Number(closingInput) || zReport.expectedCash) - zReport.expectedCash,
                    transactionCount: zReport.transactions,
                  }, DEFAULT_STORE, 58)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 text-xs font-bold hover:bg-[var(--surface-2)] transition-all cursor-pointer"
                >
                  <Printer size={15} /> Cetak Struk Z
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const doc = generateZReportPdf({
                      shiftId: currentShift.id,
                      cashierName: currentShift.cashierName,
                      startTime: currentShift.startTime,
                      endTime: Date.now(),
                      openingCash: currentShift.openingCash,
                      cashSales: zReport.cash,
                      qrisSales: zReport.qris,
                      transferSales: zReport.transfer,
                      debtIssued: zReport.kasbon,
                      debtCollected: shiftDebtRepayments,
                      expensesPaid: zReport.expenses,
                      expectedCash: zReport.expectedCash,
                      actualCash: Number(closingInput) || zReport.expectedCash,
                      difference: (Number(closingInput) || zReport.expectedCash) - zReport.expectedCash,
                      transactionCount: zReport.transactions,
                    }, DEFAULT_STORE, 58);
                    doc.save(`Z_Report_${currentShift.id}.pdf`);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 text-xs font-bold hover:bg-[var(--surface-2)] transition-all cursor-pointer"
                >
                  <FileText size={15} /> Simpan PDF
                </button>
              </div>

              <button
                disabled={!closingInput}
                onClick={handleCloseShift}
                className="w-full rounded-xl bg-[var(--danger)] hover:opacity-90 py-3 text-xs font-extrabold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
              >
                Tutup Shift & Simpan Laporan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
