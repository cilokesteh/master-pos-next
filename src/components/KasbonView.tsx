"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpenCheck,
  CheckCircle2,
  MessageSquareShare,
  Search,
  UserPlus,
  ArrowRight,
  Wallet,
  Clock,
  History,
  AlertCircle,
  X,
} from "lucide-react";
import { db, type Customer } from "@/lib/db";
import { calculateInstallment } from "@/lib/domain.mjs";
import { allocateDebtRepayment } from "@/lib/security-and-hardening.mjs";

export default function KasbonView() {
  const [query, setQuery] = useState("");
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [modalNewOpen, setModalNewOpen] = useState(false);

  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray(), [], []);
  const ledgers = useLiveQuery(() => db.debtLedgers.orderBy("timestamp").reverse().toArray(), [], []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [customers, query]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
  }, [customers]);

  const handlePayDebt = async () => {
    if (!selectedCust) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    const now = Date.now();

    await db.transaction("rw", [db.customers, db.debtLedgers, db.transactions, db.syncQueue], async () => {
      const freshCustomer = await db.customers.get(selectedCust.id);
      if (!freshCustomer) return;

      const { paid, remaining } = calculateInstallment(freshCustomer.totalDebt || 0, amount);
      if (paid <= 0) return;

      await db.customers.update(freshCustomer.id, {
        totalDebt: remaining,
        updatedAt: now,
      });

      const ledger = {
        id: crypto.randomUUID(),
        customerId: freshCustomer.id,
        customerName: freshCustomer.name,
        transactionId: `PAY-${now}`,
        type: "repayment" as const,
        amount: paid,
        balanceAfter: remaining,
        notes: paymentNote.trim() || undefined,
        timestamp: now,
      };
      await db.debtLedgers.add(ledger);

      // Reconcile unpaid invoices FIFO
      const unpaidInvoices = await db.transactions
        .where("customerId")
        .equals(freshCustomer.id)
        .toArray();
      const openInvoices = unpaidInvoices
        .filter((t) => t.paymentMethod === "kasbon" && t.debtStatus !== "paid")
        .sort((a, b) => a.timestamp - b.timestamp);

      const { updatedInvoices } = allocateDebtRepayment(openInvoices, paid);
      for (const inv of updatedInvoices) {
        await db.transactions.update(inv.id, {
          debtBalance: inv.debtBalance,
          debtStatus: inv.debtStatus,
        });
      }

      await db.syncQueue.add({
        id: crypto.randomUUID(),
        idempotencyKey: `repay-${ledger.id}`,
        entityType: "debtLedger",
        entityId: ledger.id,
        action: "upsert",
        payload: ledger as any,
        status: "pending",
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    setPaymentAmount("");
    setPaymentNote("");
    setSelectedCust(null);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;
    const now = Date.now();
    await db.customers.add({
      id: crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim(),
      totalDebt: 0,
      createdAt: now,
      updatedAt: now,
    });
    setNewName("");
    setNewPhone("");
    setModalNewOpen(false);
  };

  const sendWaReminder = (cust: Customer) => {
    if (!cust.phone) {
      alert("Pelanggan belum ada nomor WhatsApp");
      return;
    }
    const cleanPhone = cust.phone.replace(/^0/, "62").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Halo Kak ${cust.name}, pengingat ramah dari kasir warung kami. Total catatan kasbon saat ini adalah Rp ${(cust.totalDebt || 0).toLocaleString("id-ID")}. Terima kasih!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">Buku Kasbon & Piutang Pelanggan</h2>
          <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Catatan hutang langganan, pelunasan cicilan, dan rekap tagihan.</p>
        </div>
        <button
          onClick={() => setModalNewOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
        >
          <UserPlus size={15} /> <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Total Piutang Belum Lunas</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular tracking-tight">
            Rp {totalOutstanding.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">
            Dari {customers.filter((c) => (c.totalDebt || 0) > 0).length} pelanggan berhutang
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Total Data Pelanggan</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpenCheck size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-[var(--ink)] tabular tracking-tight">
            {customers.length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">Buku kontak aktif</span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">Status Kasbon</span>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular tracking-tight">
            {customers.filter((c) => (c.totalDebt || 0) === 0).length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium mt-1 block">Pelanggan bersih piutang</span>
        </div>
      </div>

      {/* Main 2-Column Split: Customer List + Detail/Payment Pane */}
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        {/* Customer List Column */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau nomor WA pelanggan..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-2.5 pl-9.5 pr-4 text-xs font-medium outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all"
            />
          </div>

          <div className="divide-y divide-[var(--line-soft)] max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--muted)]">Belum ada data pelanggan.</p>
            ) : (
              filtered.map((cust) => {
                const isSelected = selectedCust?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    className={`flex items-center justify-between py-3 px-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--brand-soft)]/40 border border-[var(--brand-border)]"
                        : "hover:bg-[var(--surface-2)]/60"
                    }`}
                    onClick={() => setSelectedCust(cust)}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-[var(--ink)] leading-snug">{cust.name}</h4>
                      <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">{cust.phone || "Tanpa No. WA"}</p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block font-medium">Sisa Kasbon</span>
                        <span className={`text-xs sm:text-sm font-black tabular ${
                          (cust.totalDebt || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          Rp {(cust.totalDebt || 0).toLocaleString("id-ID")}
                        </span>
                      </div>

                      {cust.phone && (cust.totalDebt || 0) > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendWaReminder(cust);
                          }}
                          className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Kirim Pesan Tagihan WhatsApp"
                        >
                          <MessageSquareShare size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Action Pane */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-card">
          {selectedCust ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--ink)]">{selectedCust.name}</h3>
                  <p className="text-xs text-[var(--muted)]">{selectedCust.phone || "Tanpa No. Telepon"}</p>
                </div>
                <button onClick={() => setSelectedCust(null)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)]">
                  <X size={16} />
                </button>
              </div>

              <div className="rounded-xl bg-[var(--surface-2)]/60 p-3.5 border border-[var(--line-soft)] flex justify-between items-center">
                <span className="text-xs text-[var(--muted)] font-medium">Total Piutang Belum Lunas:</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 tabular">
                  Rp {(selectedCust.totalDebt || 0).toLocaleString("id-ID")}
                </span>
              </div>

              {(selectedCust.totalDebt || 0) > 0 && (
                <div className="space-y-3 border-t border-[var(--line-soft)] pt-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] block mb-1">Nominal Cicilan / Pelunasan (Rp):</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-sm font-black tabular outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(selectedCust.totalDebt || 0))}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold hover:border-[var(--brand)] transition-all cursor-pointer"
                    >
                      Lunasi Semua
                    </button>
                    {selectedCust.totalDebt > 20000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount("20000")}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold hover:border-[var(--brand)] transition-all cursor-pointer"
                      >
                        Rp 20.000
                      </button>
                    )}
                    {selectedCust.totalDebt > 50000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount("50000")}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold hover:border-[var(--brand)] transition-all cursor-pointer"
                      >
                        Rp 50.000
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] block mb-1">Catatan Tambahan (opsional):</label>
                    <input
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Contoh: Titip uang cash lewat anak"
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                    />
                  </div>

                  <button
                    disabled={!paymentAmount || Number(paymentAmount) <= 0}
                    onClick={handlePayDebt}
                    className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] py-3 text-xs font-extrabold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Simpan Pembayaran Cicilan
                  </button>
                </div>
              )}

              {/* Customer History */}
              <div className="border-t border-[var(--line-soft)] pt-3">
                <h5 className="text-xs font-extrabold text-[var(--muted)] uppercase tracking-wider mb-2">Riwayat Transaksi Pelanggan:</h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {ledgers.filter((l) => l.customerId === selectedCust.id).length === 0 ? (
                    <p className="text-xs text-[var(--muted)] text-center py-2">Belum ada riwayat hutang/bayar.</p>
                  ) : (
                    ledgers
                      .filter((l) => l.customerId === selectedCust.id)
                      .slice(0, 5)
                      .map((l) => (
                        <div key={l.id} className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-xs">
                          <div>
                            <span className={`font-bold ${l.type === "new_debt" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {l.type === "new_debt" ? "Tambah Kasbon" : "Bayar Cicilan"}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] block">{new Date(l.timestamp).toLocaleDateString("id-ID")}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black tabular text-[var(--ink)]">
                              {l.type === "new_debt" ? "+" : "-"} Rp {l.amount.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] block">Sisa: Rp {l.balanceAfter.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center p-6 text-xs text-[var(--muted)]">
              <div className="space-y-2 max-w-[240px]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)]">
                  <BookOpenCheck size={24} />
                </div>
                <p className="font-extrabold text-[var(--ink)] text-sm">Pilih Pelanggan</p>
                <p className="text-xs text-[var(--muted)]">Pilih pelanggan di daftar sebelah kiri untuk melihat rincian hutang atau mencatat pelunasan cicilan.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Pelanggan */}
      {modalNewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100" onClick={() => setModalNewOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-2xl animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-extrabold text-sm text-[var(--ink)]">Tambah Pelanggan Baru</h3>
              <button onClick={() => setModalNewOpen(false)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)]"><X size={16} /></button>
            </div>

            <div className="space-y-3 py-3.5">
              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nama Lengkap / Panggilan:</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Pak Wahyu / Bu Ani"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nomor WhatsApp (opsional):</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[var(--line-soft)]">
              <button onClick={() => setModalNewOpen(false)} className="flex-1 rounded-xl border border-[var(--line)] py-2 text-xs font-bold hover:bg-[var(--surface-2)]">Batal</button>
              <button disabled={!newName.trim()} onClick={handleCreateCustomer} className="flex-1 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] py-2 text-xs font-extrabold text-white disabled:opacity-40">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
