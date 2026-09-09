"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DollarSign, FileText, Plus, Printer, Wallet } from "lucide-react";
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
      kasbonSales: zReport.kasbon,
      debtCollected: shiftDebtRepayments,
      expenses: zReport.expenses,
      expectedCash: zReport.expectedCash,
      actualCash: actual,
      difference: diff,
      transactionsCount: zReport.transactions,
    };

    printDirectZReport(reportData, DEFAULT_STORE, 58);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Shift & Arus Kas Laci (Petty Cash)</h2>
          <p className="text-xs text-[var(--muted)]">Kontrol uang modal, pengeluaran darurat, dan tutup buku harian.</p>
        </div>
      </div>

      {!currentShift ? (
        <div className="rounded-3xl border border-[var(--line)] bg-white p-6">
          <h3 className="text-lg font-bold">Buka Shift Kasir Baru</h3>
          <p className="text-xs text-[var(--muted)]">Masukkan uang modal awal di laci kasir pagi ini.</p>
          <div className="mt-4 flex max-w-md gap-2">
            <input
              type="number"
              value={openingInput}
              onChange={(e) => setOpeningInput(e.target.value)}
              placeholder="100000"
              className="flex-1 rounded-xl border border-[var(--line)] p-2.5 text-sm tabular outline-none focus:border-[var(--brand)]"
            />
            <button onClick={handleStartShift} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-dark)]">
              Mulai Shift
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <h3 className="font-bold">Catat Pengeluaran Operasional (Petty Cash)</h3>
              <p className="text-xs text-[var(--muted)]">Beli es batu, galon, bumbu dapur, plastik, dll.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Keterangan pengeluaran"
                  className="rounded-xl border border-[var(--line)] p-2.5 text-xs outline-none focus:border-[var(--brand)]"
                />
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Nominal (Rp)"
                  className="rounded-xl border border-[var(--line)] p-2.5 text-xs tabular outline-none focus:border-[var(--brand)]"
                />
                <div className="flex gap-1.5">
                  <select
                    value={expenseSource}
                    onChange={(e: any) => setExpenseSource(e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--line)] bg-white px-2 py-1 text-xs"
                  >
                    <option value="laci">Dari Laci</option>
                    <option value="owner">Uang Owner</option>
                  </select>
                  <button onClick={handleAddExpense} className="flex items-center gap-1 rounded-xl bg-[var(--ink)] px-3 py-2 text-xs font-bold text-white">
                    <Plus size={14} /> Tambah
                  </button>
                </div>
              </div>

              <div className="mt-4 divide-y divide-[var(--line)]">
                {shiftExpenses.length === 0 ? (
                  <p className="py-2 text-center text-xs text-[var(--muted)]">Belum ada catatan pengeluaran di shift ini.</p>
                ) : (
                  shiftExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <p className="font-semibold">{exp.description}</p>
                        <span className="text-[10px] text-[var(--muted)]">Sumber: {exp.source === "laci" ? "Laci Kasir" : "Pribadi Owner"}</span>
                      </div>
                      <span className="font-bold text-[var(--danger)] tabular">- Rp {exp.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <h3 className="font-bold">Rekap Laci Kasir (Z-Report)</h3>
            <p className="text-xs text-[var(--muted)]">Shift ID: {currentShift.id}</p>

            {zReport && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--line)]"><span>Modal Awal</span><span className="font-bold tabular">Rp {zReport.openingCash.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between py-1"><span>Penjualan Tunai</span><span className="font-bold tabular text-blue-700">+ Rp {zReport.cash.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between py-1"><span>Bayar Kasbon Masuk</span><span className="font-bold tabular text-emerald-700">+ Rp {zReport.debtPayments.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between py-1"><span>Pengeluaran Laci</span><span className="font-bold tabular text-rose-700">- Rp {zReport.expenses.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between py-2 border-t-2 border-[var(--ink)] font-bold text-sm">
                  <span>Kas Seharusnya di Laci</span>
                  <span className="tabular text-[var(--brand-dark)]">Rp {zReport.expectedCash.toLocaleString("id-ID")}</span>
                </div>

                <div className="pt-3">
                  <label className="block text-[11px] font-bold text-[var(--muted)]">Uang Fisik Dihitung Nyata:</label>
                  <input
                    type="number"
                    value={closingInput}
                    onChange={(e) => setClosingInput(e.target.value)}
                    placeholder="Hitung uang di laci..."
                    className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-center text-base font-bold tabular outline-none focus:border-[var(--brand)]"
                  />
                </div>

                {zReport.difference != null && (
                  <div className={`rounded-xl p-2.5 text-center font-bold ${zReport.difference === 0 ? "bg-emerald-50 text-emerald-800" : zReport.difference > 0 ? "bg-blue-50 text-blue-800" : "bg-rose-50 text-rose-800"}`}>
                    Selisih: {zReport.difference === 0 ? "0 (PAS)" : `${zReport.difference > 0 ? "+" : ""}Rp ${zReport.difference.toLocaleString("id-ID")}`}
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => printDirectZReport({ ...zReport, shiftId: currentShift.id, cashierName: currentShift.cashierName }, DEFAULT_STORE, 58)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-[var(--line)] py-2 text-xs font-bold hover:bg-zinc-50"
                  >
                    <Printer size={14} /> Cetak Thermal
                  </button>
                  <button
                    onClick={() => {
                      const doc = generateZReportPdf({ ...zReport, shiftId: currentShift.id, cashierName: currentShift.cashierName }, DEFAULT_STORE, 58);
                      doc.save(`ZReport_${currentShift.id}.pdf`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-[var(--line)] py-2 text-xs font-bold hover:bg-zinc-50"
                  >
                    <FileText size={14} /> PDF
                  </button>
                </div>

                <button
                  disabled={!closingInput}
                  onClick={handleCloseShift}
                  className="mt-2 w-full rounded-xl bg-[var(--danger)] py-3 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-40"
                >
                  Tutup Shift & Cetak Laporan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
