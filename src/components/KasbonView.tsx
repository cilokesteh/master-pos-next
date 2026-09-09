"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpenCheck, CheckCircle2, MessageSquareShare, Search, UserPlus } from "lucide-react";
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
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
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
    const cleanPhone = cust.phone.replace(/[^0-9]/g, "");
    const waNumber = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    const text = encodeURIComponent(
      `Halo Kak *${cust.name}*,\n` +
      `Mengingatkan catatan kasbon di Warung sebesar *Rp ${(cust.totalDebt || 0).toLocaleString("id-ID")}*.\n` +
      `Bisa dilunasi saat senggang ya kak. Matur nuwun!`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");
  };

  const selectedLedgers = useMemo(() => {
    if (!selectedCust) return [];
    return ledgers.filter((l) => l.customerId === selectedCust.id);
  }, [ledgers, selectedCust]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Buku Kasbon & Piutang Pelanggan</h2>
          <p className="text-xs text-[var(--muted)]">Catatan hutang langganan, pelunasan cicilan, dan rekap tagihan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalNewOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--brand-dark)]"
          >
            <UserPlus size={14} /> Tambah Pelanggan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Total Piutang Belum Lunas</p>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400 tabular">Rp {totalOutstanding.toLocaleString("id-ID")}</p>
          <span className="text-[11px] text-[var(--muted)]">Dari {customers.filter((c) => c.totalDebt > 0).length} pelanggan</span>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Total Data Pelanggan</p>
          <p className="mt-1 text-2xl font-black text-[var(--brand-dark)] tabular">{customers.length}</p>
          <span className="text-[11px] text-[var(--muted)]">Buku kontak aktif</span>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">Status Kasbon</p>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular">
            {customers.filter((c) => c.totalDebt === 0).length} Lunas
          </p>
          <span className="text-[11px] text-[var(--muted)]">Pelanggan bersih hutang</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau nomor WA..."
                className="w-full rounded-xl border border-[var(--line)] py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted)]">Belum ada data pelanggan.</p>
            ) : (
              filtered.map((cust) => (
                <div key={cust.id} className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-bold">{cust.name}</h4>
                    <p className="text-[11px] text-[var(--muted)]">{cust.phone || "Tanpa No. WA"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-black tabular ${cust.totalDebt > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {cust.totalDebt > 0 ? `Rp ${cust.totalDebt.toLocaleString("id-ID")}` : "Lunas"}
                      </p>
                      <span className="text-[10px] text-[var(--muted)]">
                        {cust.totalDebt > 0 ? "Belum Lunas" : "Tidak ada hutang"}
                      </span>
                    </div>
                    {cust.phone && cust.totalDebt > 0 && (
                      <button
                        onClick={() => sendWaReminder(cust)}
                        title="Kirim Tagihan via WA"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageSquareShare size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCust(cust)}
                      className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-bold hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)]"
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="font-bold">Detail & Bayar Cicilan</h3>
          {selectedCust ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--muted)]">Pelanggan</p>
                <h4 className="text-lg font-bold">{selectedCust.name}</h4>
                <p className="text-xs text-[var(--muted)]">{selectedCust.phone || "-"}</p>
                <div className="mt-3 border-t border-[var(--line)] pt-2">
                  <span className="text-xs text-[var(--muted)]">Total Piutang:</span>
                  <p className="text-xl font-black text-amber-700 tabular">
                    Rp {(selectedCust.totalDebt || 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {selectedCust.totalDebt > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)]">Nominal Bayar / Cicil (Rp):</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Contoh: 20000"
                      className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm font-bold tabular outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPaymentAmount(String(selectedCust.totalDebt))}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold hover:border-[var(--brand)]"
                    >
                      Lunasi Semua
                    </button>
                    {selectedCust.totalDebt > 20000 && (
                      <button
                        onClick={() => setPaymentAmount("20000")}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold hover:border-[var(--brand)]"
                      >
                        20.000
                      </button>
                    )}
                    {selectedCust.totalDebt > 50000 && (
                      <button
                        onClick={() => setPaymentAmount("50000")}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-bold hover:border-[var(--brand)]"
                      >
                        50.000
                      </button>
                    )}
                  </div>
                  <div>
                    <input
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Catatan pelunasan (opsional)"
                      className="w-full rounded-xl border border-[var(--line)] p-2 text-xs outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <button
                    disabled={!paymentAmount || Number(paymentAmount) <= 0}
                    onClick={handlePayDebt}
                    className="w-full rounded-xl bg-[var(--brand)] py-3 text-xs font-bold text-white shadow hover:bg-[var(--brand-dark)] disabled:opacity-40"
                  >
                    Simpan Pembayaran
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
                  Pelanggan ini tidak memiliki tunggakan kasbon.
                </div>
              )}

              <div className="border-t border-[var(--line)] pt-3">
                <h5 className="text-xs font-bold text-[var(--muted)]">Riwayat Kasbon & Cicilan:</h5>
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {selectedLedgers.length === 0 ? (
                    <p className="text-[11px] text-[var(--muted)]">Belum ada riwayat transaksi hutang.</p>
                  ) : (
                    selectedLedgers.map((l) => (
                      <div key={l.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] p-2 text-[11px]">
                        <div>
                          <p className="font-semibold">{l.type === "new_debt" ? "Kasbon Baru" : "Pembayaran/Cicilan"}</p>
                          <span className="text-[9px] text-[var(--muted)]">
                            {new Date(l.timestamp).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold tabular ${l.type === "new_debt" ? "text-amber-700" : "text-emerald-700"}`}>
                            {l.type === "new_debt" ? "+" : "-"}Rp {l.amount.toLocaleString("id-ID")}
                          </span>
                          <p className="text-[9px] text-[var(--muted)]">Sisa: Rp {l.balanceAfter.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-center text-xs text-[var(--muted)]">Pilih pelanggan di daftar kiri untuk melihat detail atau mencatat cicilan.</p>
          )}
        </div>
      </div>

      {modalNewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[var(--surface)] p-5">
            <h3 className="text-base font-bold">Tambah Pelanggan Baru</h3>
            <div className="mt-3 space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Pelanggan (Contoh: Bu Siti / Mas Joko)"
                className="w-full rounded-xl border border-[var(--line)] p-2.5 text-xs outline-none focus:border-[var(--brand)]"
              />
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Nomor WhatsApp (Contoh: 08123456789)"
                className="w-full rounded-xl border border-[var(--line)] p-2.5 text-xs outline-none focus:border-[var(--brand)]"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setModalNewOpen(false)}
                className="flex-1 rounded-xl border border-[var(--line)] py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                disabled={!newName.trim()}
                onClick={handleCreateCustomer}
                className="flex-1 rounded-xl bg-[var(--brand)] py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
