"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, ChevronUp, X, Sparkles } from "lucide-react";
import type { Product } from "@/lib/db";
import { useCart } from "@/lib/cart-store";
import { calculateCartTotals } from "@/lib/domain.mjs";
import PaymentModal from "./PaymentModal";

export default function CashierView({ products, query, setQuery }: { products: Product[]; query: string; setQuery: (q: string) => void }) {
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [payOpen, setPayOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const { items, add, changeQty, remove, discount, clear } = useCart();

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visible = useMemo(() => selectedCat === "Semua" ? products : products.filter((p) => p.category === selectedCat), [products, selectedCat]);
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);

  // Color mapping per category for vibrant visual cues
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Makanan": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Minuman": return "bg-amber-50 text-amber-800 border-amber-200";
      case "Snack": return "bg-orange-50 text-orange-800 border-orange-200";
      case "Sembako": return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Rokok": return "bg-stone-100 text-stone-700 border-stone-300";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      <div className="grid gap-5 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px] w-full min-w-0">
        <div className="space-y-3.5 w-full min-w-0 overflow-hidden pb-28 lg:pb-0">
          {/* Category Chips with warm pill style */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar w-full min-w-0">
            {categories.map((cat) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`whitespace-nowrap shrink-0 rounded-2xl px-4 py-2 text-xs font-black transition-all ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-md shadow-rose-500/20 scale-[1.02]"
                      : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-zinc-300 shadow-2xs"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Cards — Vibrant, warm, tactile design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              const cartItem = items.find((i) => i.productId === product.id);
              const totalInCart = items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.qty, 0);

              return (
                <div
                  key={product.id}
                  className={`relative flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-white p-4 shadow-xs transition-all hover:border-[var(--brand)] hover:shadow-md ${
                    outOfStock ? "opacity-40 grayscale" : ""
                  }`}
                >
                  {/* Category Accent Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-xl border px-2.5 py-0.5 text-[10px] font-black ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                    {totalInCart > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                        <Sparkles size={10} /> {totalInCart} di keranjang
                      </span>
                    )}
                    {product.trackStock && totalInCart === 0 && (
                      <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${product.stock <= 5 ? "bg-amber-100 text-amber-900 font-black" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
                        Stok {product.stock}
                      </span>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div className="mt-2.5 min-w-0 flex-1">
                    <h3 className="text-sm font-black text-[var(--ink)] leading-snug break-words">
                      {product.name}
                    </h3>
                    <p className="mt-1.5 text-lg font-black text-[var(--brand)] tabular">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* Variant Buttons / Direct Add CTA */}
                  {product.variants?.length ? (
                    <div className="mt-3 pt-2.5 border-t border-[var(--line)]">
                      <p className="text-[10px] font-bold text-[var(--muted)] mb-1.5">Pilih Varian:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((v) => (
                          <button
                            key={v}
                            disabled={outOfStock}
                            onClick={() => add(product, v)}
                            className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--ink-soft)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)] active:scale-95 transition-all"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={outOfStock}
                      onClick={() => add(product)}
                      className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--surface-2)] py-2.5 text-xs font-black text-[var(--ink)] transition-all hover:bg-[var(--brand)] hover:text-white hover:shadow-md hover:shadow-rose-500/20 active:scale-95"
                    >
                      <Plus size={15} /> Tambah Menu
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Cart Panel (Modern Dark/Warm Slate) */}
        <div className="hidden rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm lg:flex lg:flex-col h-[calc(100vh-95px)] sticky top-20">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <ShoppingBag size={17} />
              </div>
              <div>
                <h2 className="font-black text-sm">Pesanan Aktif</h2>
                <p className="text-[11px] text-[var(--muted)]">{totals.units} item dipilih</p>
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-xs font-bold text-[var(--danger)] hover:bg-rose-50 px-2 py-1 rounded-lg">
                Kosongkan
              </button>
            )}
          </div>

          <div className="my-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-xs text-[var(--muted)] p-6">
                <div className="space-y-2">
                  <ShoppingBag size={32} className="mx-auto text-stone-300" />
                  <p className="font-bold text-[var(--ink-soft)]">Keranjang Kosong</p>
                  <p className="text-[11px] text-[var(--muted)]">Sentuh produk di sebelah kiri untuk memasukkan pesanan.</p>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black truncate text-[var(--ink)]">{item.name}</h4>
                        {item.variant && (
                          <span className="inline-block mt-1 rounded-md bg-white border border-[var(--line)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">
                            Varian: {item.variant}
                          </span>
                        )}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-stone-400 hover:text-[var(--danger)] p-1 shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1 shadow-2xs">
                        <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Minus size={12} /></button>
                        <span className="w-5 text-center text-xs font-black tabular">{item.qty}</span>
                        <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Plus size={12} /></button>
                      </div>
                      <span className="text-xs font-black tabular text-[var(--brand)]">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-[var(--line)] pt-3.5 space-y-2">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Subtotal</span>
              <span className="font-bold tabular text-[var(--ink)]">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-base font-black">
              <span>Total Tagihan</span>
              <span className="text-[var(--brand)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => setPayOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 font-black text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-[var(--brand-dark)] active:scale-98 disabled:opacity-40"
            >
              Bayar Pesanan <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Floating Cart Dock (Warm Red Accent) */}
        {items.length > 0 && (
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-3xl bg-[var(--brand)] p-3 text-white shadow-2xl shadow-rose-600/35 lg:hidden">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2.5 text-left min-w-0 pr-2 flex-1"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
                <ShoppingBag size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] text-rose-100 font-bold">
                  <span>{totals.units} item di keranjang</span>
                  <ChevronUp size={13} />
                </div>
                <p className="text-base font-black tabular truncate">Rp {totals.total.toLocaleString("id-ID")}</p>
              </div>
            </button>
            <button
              onClick={() => setPayOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-[var(--brand)] shadow-sm shrink-0 active:scale-95"
            >
              Bayar <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Mobile Full Cart Drawer / Bottom Sheet */}
        {cartDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 lg:hidden flex flex-col justify-end"
            onClick={() => setCartDrawerOpen(false)}
          >
            <div
              className="w-full bg-white rounded-t-3xl max-h-[82vh] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <ShoppingBag size={17} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">Rincian Keranjang</h3>
                    <p className="text-[11px] text-[var(--muted)]">{totals.units} item dipilih</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button onClick={clear} className="text-xs font-black text-[var(--danger)] px-2 py-1 hover:bg-rose-50 rounded-lg">
                      Kosongkan
                    </button>
                  )}
                  <button onClick={() => setCartDrawerOpen(false)} className="p-1 rounded-full hover:bg-zinc-100 text-[var(--muted)]">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="my-3 flex-1 space-y-2.5 overflow-y-auto max-h-[48vh] pr-1">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-[var(--ink)] break-words">{item.name}</h4>
                          {item.variant && (
                            <span className="inline-block mt-1 rounded-md bg-white border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                              Varian: {item.variant}
                            </span>
                          )}
                        </div>
                        <button onClick={() => remove(item.id)} className="text-stone-400 hover:text-[var(--danger)] p-1 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 shadow-2xs">
                          <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Minus size={14} /></button>
                          <span className="w-7 text-center text-sm font-black tabular">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Plus size={14} /></button>
                        </div>
                        <span className="text-sm font-black text-[var(--brand)] tabular">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--line)] pt-3.5 space-y-2">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span className="font-bold tabular text-[var(--ink)]">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-base font-black">
                  <span>Total Bayar</span>
                  <span className="text-[var(--brand)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
                </div>
                <button
                  disabled={items.length === 0}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setPayOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 font-black text-white shadow-lg shadow-rose-600/30 active:scale-98 disabled:opacity-40"
                >
                  Lanjut Pembayaran <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {payOpen && <PaymentModal totals={totals} items={items} onClose={() => setPayOpen(false)} />}
      </div>
    </div>
  );
}
