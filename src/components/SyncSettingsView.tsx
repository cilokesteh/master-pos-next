"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, ShieldCheck, Upload } from "lucide-react";
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
    setMessage("File cadangan JSON berhasil diunduh.");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importLocalBackup(parsed);
      setMessage("Data cadangan berhasil dipulihkan.");
      await refresh();
    } catch (err: any) {
      setMessage("Gagal impor: " + (err.message || "File rusak"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sinkronisasi & Cadangan Data</h2>
        <p className="text-xs text-[var(--muted)]">Status antrean offline, backup file JSON, dan kesiapan cloud sync.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Antrean Belum Sinkron</p>
          <p className="mt-1 text-2xl font-black text-amber-700 tabular">{stats.pending}</p>
          <span className="text-[11px] text-[var(--muted)]">Tersimpan aman di IndexedDB</span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Data Tersinkron</p>
          <p className="mt-1 text-2xl font-black text-emerald-700 tabular">{stats.synced}</p>
          <span className="text-[11px] text-[var(--muted)]">Riwayat sinkron cloud</span>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Mode Operasional</p>
          <p className="mt-1 text-lg font-black text-[var(--brand-dark)]">Offline-First</p>
          <span className="text-[11px] text-[var(--muted)]">Bekerja tanpa ketergantungan internet</span>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
          <h3 className="font-bold">Cadangkan Data (Export JSON)</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Unduh seluruh produk, riwayat transaksi, buku kasbon, dan pengeluaran ke file JSON lokal di HP / komputer.
          </p>
          <button
            onClick={handleExport}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[var(--brand-dark)]"
          >
            <Download size={15} /> Unduh File Cadangan
          </button>
        </div>

        <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
          <h3 className="font-bold">Pulihkan Data (Import JSON)</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Pulihkan data dari file cadangan jika berpindah perangkat kasir baru.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-zinc-200">
            <Upload size={15} /> {loading ? "Memproses..." : "Pilih File Cadangan"}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
