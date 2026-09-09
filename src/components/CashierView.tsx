"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/db";
import { useCart } from "@/lib/cart-store";
import { calculateCartTotals } from "@/lib/domain.mjs";
import PaymentModal from "./PaymentModal";

export default function CashierView({ products, query, setQuery }: { products: Product[]; query: string; setQuery: (q: string) => void }) {
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [payOpen, setPayOpen] = useState(false);
  const { items, add, changeQty, remove, discount, clear } = useCart();

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visible = useMemo(() => selectedCat === "Semua" ? products : products.filter((p) => p.category === selectedCat), [products, selectedCat]);
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] w-full min-w-0">
        <div className="space-y-3 w-full min-w-0 overflow-hidden">
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full min-w-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${selectedCat === cat ? "bg-[var(--brand)] text-white shadow-xs" : "border border-[var(--line)] bg-white text-[var(--muted)] hover:bg-zinc-50"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards — 1 column on narrow mobile, 2 on medium, 3-4 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              return (
                <div
                  key={product.id}
                  className={`flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-white p-3 shadow-xs transition hover:border-[var(--brand)] w-full min-w-0 ${outOfStock ? "opacity-50" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[var(--ink)] leading-snug break-words min-w-0 flex-1">
                        {product.name}
                      </h3>
                      {product.trackStock && (
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${product.stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"}`}>
                          {product.stock}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-base font-black text-[var(--brand-dark)] tabular">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {product.variants?.length ? (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {product.variants.map((v) => (
                        <button
                          key={v}
                          disabled={outOfStock}
                          onClick={() => add(product, v)}
                          className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--ink)] hover:border-[var(--brand)] active:scale-95"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      disabled={outOfStock}
                      onClick={() => add(product)}
                      className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--brand-soft)] py-2 text-xs font-bold text-[var(--brand-dark)] transition hover:bg-[var(--brand)] hover:text-white active:scale-98"
                    >
                      <Plus size={14} /> Tambah
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Cart Panel */}
        <div className="hidden rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm lg:flex lg:flex-col h-[calc(100vh-100px)] sticky top-20">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="font-bold">Pesanan Kasir</h2>
              <p className="text-xs text-[var(--muted)]">{totals.units} item terpilih</p>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-xs font-semibold text-[var(--danger)] hover:underline">
                Kosongkan
              </button>
            )}
          </div>

          <div className="my-2 flex-1 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-xs text-[var(--muted)]">
                Belum ada produk dipilih.<br/>Sentuh produk di kiri untuk menambah pesanan.
              </div>
            ) : (
              items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                        {item.variant && <span className="text-[11px] text-[var(--muted)]">Varian: {item.variant}</span>}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-[var(--muted)] hover:text-[var(--danger)] shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-2 py-1">
                        <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)}><Minus size={13} /></button>
                        <span className="w-6 text-center text-xs font-bold tabular">{item.qty}</span>
                        <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)}><Plus size={13} /></button>
                      </div>
                      <span className="text-sm font-bold tabular">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-[var(--line)] pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Subtotal</span>
              <span className="font-bold tabular">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => setPayOpen(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 font-bold text-white shadow-md transition hover:bg-[var(--brand-dark)] disabled:opacity-40"
            >
              Bayar Pesanan <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* Mobile Floating Checkout Dock */}
        {items.length > 0 && (
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-2xl bg-[var(--brand)] p-3.5 text-white shadow-2xl lg:hidden">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] text-white/80">{totals.units} item terpilih</p>
              <p className="text-base font-black tabular truncate">Rp {totals.total.toLocaleString("id-ID")}</p>
            </div>
            <button
              onClick={() => setPayOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[var(--brand-dark)] shadow shrink-0"
            >
              Bayar <ArrowRight size={14} />
            </button>
          </div>
        )}

        {payOpen && <PaymentModal totals={totals} items={items} onClose={() => setPayOpen(false)} />}
      </div>
    </div>
  );
}
