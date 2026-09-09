"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { aggregateSales, rankProducts, toCsv } from "@/lib/reports.mjs";

export default function ReportsView() {
  const [range, setRange] = useState<"today" | "all">("today");
  const transactions = useLiveQuery(() => db.transactions.orderBy("timestamp").reverse().toArray(), [], []);

  const filtered = useMemo(() => {
    if (range === "all") return transactions;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime();
    return transactions.filter((t) => t.timestamp >= start);
  }, [transactions, range]);

  const stats = useMemo(() => aggregateSales(filtered), [filtered]);
  const ranked = useMemo(() => rankProducts(filtered), [filtered]);

  const exportCsv = () => {
    const csv = toCsv(
      filtered.map((t) => ({
        receiptNumber: t.receiptNumber,
        date: new Date(t.timestamp).toLocaleString("id-ID"),
        method: t.paymentMethod,
        total: t.total,
        profit: t.grossProfit,
      })),
      [
        { key: "receiptNumber", label: "No. Struk" },
        { key: "date", label: "Tanggal" },
        { key: "method", label: "Metode" },
        { key: "total", label: "Omzet (Rp)" },
        { key: "profit", label: "Laba Kotor (Rp)" },
      ]
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Penjualan_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Laporan & Analisis Warung</h2>
          <p className="text-xs text-[var(--muted)]">Rekap pendapatan, HPP, laba kotor, dan kasbon.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--line)] bg-white p-1">
            <button onClick={() => setRange("today")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${range === "today" ? "bg-[var(--brand)] text-white" : "text-[var(--muted)]"}`}>Hari Ini</button>
            <button onClick={() => setRange("all")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${range === "all" ? "bg-[var(--brand)] text-white" : "text-[var(--muted)]"}`}>Semua</button>
          </div>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--ink)] hover:bg-zinc-50">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Total Omzet</p>
          <p className="mt-1 text-xl font-black text-[var(--brand-dark)] tabular">Rp {stats.omzet.toLocaleString("id-ID")}</p>
          <span className="text-[11px] text-[var(--muted)]">{stats.transactions} transaksi</span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Estimasi Laba Kotor</p>
          <p className="mt-1 text-xl font-black text-emerald-700 tabular">Rp {stats.grossProfit.toLocaleString("id-ID")}</p>
          <span className="text-[11px] text-[var(--muted)]">HPP: Rp {stats.hpp.toLocaleString("id-ID")}</span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Uang Tunai Laci</p>
          <p className="mt-1 text-xl font-black text-blue-700 tabular">Rp {stats.cash.toLocaleString("id-ID")}</p>
          <span className="text-[11px] text-[var(--muted)]">Tunai langsung</span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Kasbon / Piutang Baru</p>
          <p className="mt-1 text-xl font-black text-amber-700 tabular">Rp {stats.kasbon.toLocaleString("id-ID")}</p>
          <span className="text-[11px] text-[var(--muted)]">Belum terbayar</span>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
        <h3 className="font-bold">Top Menu / Produk Terlaris</h3>
        <div className="mt-3 divide-y divide-[var(--line)]">
          {ranked.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--muted)]">Belum ada transaksi pada periode ini.</p>
          ) : (
            ranked.slice(0, 6).map((p, idx) => (
              <div key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--surface-2)] text-xs font-bold text-[var(--muted)]">{idx + 1}</span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular">{p.qty} terjual</p>
                  <p className="text-xs text-[var(--muted)] tabular">Rp {p.omzet.toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
