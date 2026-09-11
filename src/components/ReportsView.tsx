"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, TrendingUp, DollarSign, Wallet, AlertCircle, BarChart2 } from "lucide-react";
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
    <div className="space-y-6 max-w-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">Laporan & Analisis Warung</h2>
          <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Rekapitulasi omzet, margin kotor, kas laci, dan piutang pelanggan.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-2xs">
            <button
              onClick={() => setRange("today")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                range === "today"
                  ? "bg-[var(--brand)] text-white shadow-2xs font-extrabold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setRange("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                range === "all"
                  ? "bg-[var(--brand)] text-white shadow-2xs font-extrabold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Semua Waktu
            </button>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} /> <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Total Omzet</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-[var(--ink)] tabular tracking-tight">
            Rp {stats.omzet.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">
            {stats.transactions} total transaksi
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Estimasi Laba Kotor</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <DollarSign size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular tracking-tight">
            Rp {stats.grossProfit.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">
            HPP Modal: Rp {stats.hpp.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Uang Tunai Laci</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wallet size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular tracking-tight">
            Rp {stats.cash.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">
            Tunai langsung di kasir
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Kasbon / Piutang Baru</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular tracking-tight">
            Rp {stats.kasbon.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">
            Belum terbayar pelanggan
          </span>
        </div>
      </div>

      {/* Top Products Table / Ranking */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)]">
              <BarChart2 size={16} />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--ink)]">Top Menu / Produk Terlaris</h3>
          </div>
          <span className="text-[11px] font-bold text-[var(--muted)]">Berdasarkan Volume Penjualan</span>
        </div>

        <div className="mt-2 divide-y divide-[var(--line-soft)]">
          {ranked.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--muted)]">Belum ada transaksi pada periode ini.</p>
          ) : (
            ranked.slice(0, 8).map((p, idx) => (
              <div key={p.productId} className="flex items-center justify-between py-3 text-xs sm:text-sm hover:bg-[var(--surface-2)]/40 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 place-items-center rounded-xl text-xs font-black tabular ${
                    idx === 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : idx === 1
                      ? "bg-slate-500/15 text-slate-700 dark:text-slate-300"
                      : idx === 2
                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-[var(--ink)] leading-snug">{p.name}</h4>
                    <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">{p.units} unit terjual</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-[var(--ink)] tabular block">
                    Rp {p.omzet.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">Omzet kontribusi</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
