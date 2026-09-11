"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, FileText, Printer, Send, X, Banknote, QrCode, ArrowRightLeft, BookUser } from "lucide-react";
import { db, type CartItem } from "@/lib/db";
import { DEFAULT_STORE } from "@/lib/seed";
import { useCart } from "@/lib/cart-store";
import { roundCash } from "@/lib/domain.mjs";
import { generateThermalPdf, printDirectThermal, shareViaWhatsApp } from "@/lib/pdf-engine";
import { validateCheckoutInventory, debtBalanceAfter } from "@/lib/checkout-domain.mjs";

export default function PaymentModal({ totals, items, onClose }: { totals: any; items: CartItem[]; onClose: () => void }) {
  const [method, setMethod] = useState<"cash" | "qris" | "transfer" | "kasbon">("cash");
  const [cashInput, setCashInput] = useState(String(totals.total));
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [completedTx, setCompletedTx] = useState<any | null>(null);
  const { clear } = useCart();

  const cashTendered = Number(cashInput) || 0;
  const change = Math.max(0, cashTendered - totals.total);
  const quickCashPresets = useMemo(() => [
    totals.total,
    roundCash(totals.total, 1000),
    10000, 20000, 50000, 100000
  ].filter((v, i, a) => v >= totals.total && a.indexOf(v) === i).slice(0, 5), [totals.total]);

  const handleCheckout = async () => {
    const now = Date.now();
    const d = new Date(now);
    const receiptNumber = `W-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(1000+Math.random()*9000)}`;

    const openShift = await db.shifts.where("status").equals("open").first();

    const tx = {
      id: crypto.randomUUID(),
      receiptNumber,
      items,
      units: totals.units,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      cost: totals.cost,
      grossProfit: totals.grossProfit,
      paymentMethod: method,
      cashTendered: method === "cash" ? cashTendered : 0,
      cashChange: method === "cash" ? change : 0,
      splitCash: 0,
      splitNonCash: 0,
      shiftId: openShift?.id,
      cashierName: openShift?.cashierName || "Kasir",
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      debtBalance: method === "kasbon" ? totals.total : 0,
      debtStatus: (method === "kasbon" ? "unpaid" : "none") as any,
      timestamp: now,
      synced: false,
    };

    await db.transaction("rw", [db.transactions, db.products, db.customers, db.debtLedgers, db.syncQueue], async () => {
      const trackedIds = items.filter((item) => item.trackStock).map((item) => item.productId);
      const currentProducts = await db.products.bulkGet(trackedIds);
      const productMap = new Map(currentProducts.filter(Boolean).map((product) => [product!.id, product!]));
      const stockMutations = validateCheckoutInventory(items, productMap);

      for (const mutation of stockMutations) {
        await db.products.update(mutation.productId, { stock: mutation.nextStock, updatedAt: now });
      }

      let customerMutation: Record<string, unknown> | undefined;
      let debtMutation: Record<string, unknown> | undefined;
      if (method === "kasbon" && customerName) {
        let cust = await db.customers.where("name").equals(customerName).first();
        const custId = cust?.id || crypto.randomUUID();
        const balanceAfter = debtBalanceAfter(cust?.totalDebt || 0, totals.total);
        if (!cust) {
          cust = { id: custId, name: customerName, phone: customerPhone, totalDebt: balanceAfter, createdAt: now, updatedAt: now };
          await db.customers.add(cust);
        } else {
          await db.customers.update(custId, { totalDebt: balanceAfter, updatedAt: now });
        }
        const ledger = {
          id: crypto.randomUUID(), customerId: custId, customerName, transactionId: tx.id,
          type: "new_debt" as const, amount: totals.total, balanceAfter, timestamp: now,
        };
        await db.debtLedgers.add(ledger);
        customerMutation = { ...cust, totalDebt: balanceAfter, updatedAt: now };
        debtMutation = ledger;
      }

      await db.transactions.add(tx);
      const operations = [
        { entityType: "transaction", entityId: tx.id, payload: tx as Record<string, unknown> },
        ...stockMutations.map((mutation) => ({ entityType: "product", entityId: mutation.productId, payload: mutation as Record<string, unknown> })),
        ...(customerMutation ? [{ entityType: "customer", entityId: String(customerMutation.id), payload: customerMutation }] : []),
        ...(debtMutation ? [{ entityType: "debtLedger", entityId: String(debtMutation.id), payload: debtMutation }] : []),
      ];
      for (const operation of operations) {
        const id = crypto.randomUUID();
        await db.syncQueue.add({
          id, idempotencyKey: `${operation.entityType}-${operation.entityId}-${tx.id}`,
          entityType: operation.entityType as any, entityId: operation.entityId,
          action: "upsert", payload: operation.payload, status: "pending",
          attempts: 0, createdAt: now, updatedAt: now,
        });
      }
    });

    clear();
    setCompletedTx(tx);
  };

  const getMethodIcon = (m: string) => {
    switch (m) {
      case "cash": return Banknote;
      case "qris": return QrCode;
      case "transfer": return ArrowRightLeft;
      case "kasbon": return BookUser;
      default: return Banknote;
    }
  };

  if (completedTx) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="mt-3 text-lg font-black text-[var(--ink)]">Transaksi Sukses!</h3>
          <p className="text-xs text-[var(--muted)] font-medium mt-0.5">No. Struk: {completedTx.receiptNumber}</p>
          
          <div className="my-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/80 p-3.5 text-xs text-left space-y-1.5">
            <div className="flex justify-between text-[var(--muted)] font-medium">
              <span>Metode:</span>
              <span className="font-bold text-[var(--ink)] uppercase">{completedTx.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)] font-medium">
              <span>Total Tagihan:</span>
              <span className="font-black text-[var(--ink)] tabular">Rp {completedTx.total.toLocaleString("id-ID")}</span>
            </div>
            {completedTx.paymentMethod === "cash" && (
              <>
                <div className="flex justify-between text-[var(--muted)] font-medium">
                  <span>Diterima:</span>
                  <span className="font-bold text-[var(--ink)] tabular">Rp {completedTx.cashTendered.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--line-soft)] pt-1.5 font-bold text-[var(--brand-dark)]">
                  <span>Kembalian Kasir:</span>
                  <span className="text-sm font-black tabular">Rp {completedTx.cashChange.toLocaleString("id-ID")}</span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => printDirectThermal(completedTx, DEFAULT_STORE, 58)} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] transition-all">
              <Printer size={16}/> Cetak
            </button>
            <button onClick={() => { const doc = generateThermalPdf(completedTx, DEFAULT_STORE, 58); doc.save(`${completedTx.receiptNumber}.pdf`); }} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] transition-all">
              <FileText size={16}/> PDF
            </button>
            <button onClick={() => shareViaWhatsApp(completedTx, DEFAULT_STORE, completedTx.customerPhone)} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all">
              <Send size={16}/> WA
            </button>
          </div>

          <button onClick={onClose} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 font-extrabold text-xs text-white shadow-sm hover:bg-[var(--brand-hover)] active:scale-98 transition-all cursor-pointer">
            Selesai / Transaksi Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-t-3xl bg-[var(--surface)] border border-[var(--line)] p-5 sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="font-extrabold text-base text-[var(--ink)]">Pembayaran</h3>
            <p className="text-xs text-[var(--muted)] font-medium mt-0.5">
              Total Tagihan: <span className="font-bold text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--surface-2)] text-[var(--muted)]">
            <X size={18}/>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {(["cash", "qris", "transfer", "kasbon"] as const).map((m) => {
            const Icon = getMethodIcon(m);
            const active = method === m;
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)] shadow-2xs font-extrabold"
                    : "border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon size={16} />
                <span>{m === "cash" ? "Tunai" : m.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {method === "cash" && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nominal Uang Diterima:</label>
              <input
                type="number"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-2.5 text-center text-xl font-black tabular outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {quickCashPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => setCashInput(String(p))}
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold tabular text-[var(--ink)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-all cursor-pointer"
                >
                  {p === totals.total ? "Uang Pas" : `Rp ${p.toLocaleString("id-ID")}`}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm font-bold">
              <span className="text-xs text-[var(--muted)]">Uang Kembalian:</span>
              <span className="text-base font-black text-[var(--brand-dark)] tabular">Rp {change.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {method === "kasbon" && (
          <div className="mt-4 space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nama Pelanggan (Wajib Catat Kasbon):</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Pak Budi / Bu Siti"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs font-medium outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--muted)] block mb-1">Nomor WhatsApp Pelanggan (opsional):</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs font-medium outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>
        )}

        <button
          disabled={(method === "cash" && cashTendered < totals.total) || (method === "kasbon" && !customerName.trim())}
          onClick={handleCheckout}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3.5 font-extrabold text-xs sm:text-sm text-white shadow-md active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Konfirmasi Pembayaran
        </button>
      </div>
    </div>
  );
}
