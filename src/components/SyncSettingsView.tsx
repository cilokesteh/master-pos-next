"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, ShieldCheck, Upload, Database, HardDrive, CheckCircle2 } from "lucide-react";
import { exportLocalBackup, getSyncStats, importLocalBackup } from "@/lib/sync-engine";

export default function SyncSettingsView() {
  const [stats, setStats] = useState({ total: 0, pending: 0, synced: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const s = await getSyncStats();
    setStats(s);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleExport = async () => {
    const backup = await exportLocalBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_master_pos_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("File cadangan JSON berhasil diunduh ke perangkat Anda.");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importLocalBackup(parsed);
      setMessage("Data cadangan berhasil dipulihkan secara penuh.");
      await refresh();
    } catch (err: any) {
      setMessage("Gagal impor: " + (err.message || "File cadangan tidak valid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="border-b border-[var(--line)] pb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">Sinkronisasi & Cadangan Data</h2>
        <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Status antrean offline, backup file JSON, dan kesiapan cloud sync.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Antrean Belum Sinkron</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <RefreshCw size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 tabular tracking-tight">{stats.pending}</p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">Tersimpan aman di IndexedDB</span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Data Tersinkron</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular tracking-tight">{stats.synced}</p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">Riwayat sinkron cloud</span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Mode Operasional</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <HardDrive size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)] tracking-tight">Offline-First</p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">Bekerja tanpa ketergantungan internet</span>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Download size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--ink)]">Cadangkan Data (Export JSON)</h3>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Unduh seluruh produk, riwayat transaksi, buku kasbon, dan pengeluaran ke file JSON lokal di HP / komputer Anda.
          </p>
          <button
            onClick={handleExport}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
          >
            <Download size={15} /> <span>Unduh File Cadangan</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/15 text-blue-600">
              <Upload size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--ink)]">Pulihkan Data (Import JSON)</h3>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Pulihkan seluruh data kasir dari file cadangan JSON jika Anda berpindah perangkat kasir baru.
          </p>
          <label className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-extrabold text-[var(--ink)] shadow-2xs transition-all">
            <Upload size={15} /> <span>{loading ? "Memproses..." : "Pilih File Cadangan"}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
