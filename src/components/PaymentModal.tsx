"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Printer, Send, X } from "lucide-react";
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

  if (completedTx) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--brand)]" />
          <h3 className="mt-2 text-xl font-bold">Transaksi Sukses!</h3>
          <p className="text-sm text-[var(--muted)]">No. Struk: {completedTx.receiptNumber}</p>
          <div className="my-4 rounded-xl bg-[var(--surface-2)] p-3 text-sm">
            <div className="flex justify-between"><span>Total</span><span className="font-bold">Rp {completedTx.total.toLocaleString("id-ID")}</span></div>
            {completedTx.paymentMethod === "cash" && <div className="mt-1 flex justify-between text-xs text-[var(--muted)]"><span>Kembalian</span><span className="font-bold text-[var(--brand)]">Rp {completedTx.cashChange.toLocaleString("id-ID")}</span></div>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => printDirectThermal(completedTx, DEFAULT_STORE, 58)} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--line)] p-2.5 text-xs font-semibold hover:bg-zinc-50"><Printer size={16}/> Cetak</button>
            <button onClick={() => { const doc = generateThermalPdf(completedTx, DEFAULT_STORE, 58); doc.save(`${completedTx.receiptNumber}.pdf`); }} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--line)] p-2.5 text-xs font-semibold hover:bg-zinc-50"><FileText size={16}/> PDF</button>
            <button onClick={() => shareViaWhatsApp(completedTx, DEFAULT_STORE, completedTx.customerPhone)} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--line)] p-2.5 text-xs font-semibold text-[var(--brand-dark)] hover:bg-emerald-50"><Send size={16}/> WA</button>
          </div>
          <button onClick={onClose} className="mt-5 w-full rounded-xl bg-[var(--brand)] py-3 font-bold text-white">Selesai / Transaksi Baru</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div><h3 className="font-bold">Pembayaran</h3><p className="text-xs text-[var(--muted)]">Total Tagihan: Rp {totals.total.toLocaleString("id-ID")}</p></div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100"><X size={18}/></button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {(["cash", "qris", "transfer", "kasbon"] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border py-2.5 text-xs font-bold capitalize transition ${method === m ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}>
              {m === "cash" ? "Tunai" : m.toUpperCase()}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <div className="mt-4 space-y-3">
            <input type="number" value={cashInput} onChange={(e) => setCashInput(e.target.value)} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] py-3 text-center text-2xl font-bold tabular outline-none focus:border-[var(--brand)]" />
            <div className="flex flex-wrap gap-1.5">
              {quickCashPresets.map((p) => (
                <button key={p} onClick={() => setCashInput(String(p))} className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold tabular hover:border-[var(--brand)]">
                  {p === totals.total ? "Uang Pas" : `Rp ${p.toLocaleString("id-ID")}`}
                </button>
              ))}
            </div>
            <div className="flex justify-between rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm font-bold">
              <span>Kembalian</span><span className="text-[var(--brand)] tabular">Rp {change.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {method === "kasbon" && (
          <div className="mt-4 space-y-2">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama Pelanggan (Wajib)" className="w-full rounded-xl border border-[var(--line)] p-2.5 text-sm outline-none focus:border-[var(--brand)]" />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="No. WA Pelanggan (opsional)" className="w-full rounded-xl border border-[var(--line)] p-2.5 text-sm outline-none focus:border-[var(--brand)]" />
          </div>
        )}

        <button disabled={method === "cash" && cashTendered < totals.total || (method === "kasbon" && !customerName.trim())} onClick={handleCheckout} className="mt-5 w-full rounded-2xl bg-[var(--brand)] py-3.5 font-bold text-white shadow-md disabled:opacity-40">
          Konfirmasi Pembayaran
        </button>
      </div>
    </div>
  );
}
