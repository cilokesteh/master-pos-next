"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, ChevronUp, X, Utensils, Coffee, Cookie, ShoppingCart, Flame, Sparkles } from "lucide-react";
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

  // Visual Category Meta
  const getCatMeta = (cat: string) => {
    switch (cat) {
      case "Makanan": return { icon: Utensils, label: "Makanan", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
      case "Minuman": return { icon: Coffee, label: "Minuman", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "Snack": return { icon: Cookie, label: "Camilan", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" };
      case "Sembako": return { icon: ShoppingCart, label: "Sembako", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      case "Rokok": return { icon: Flame, label: "Rokok", badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" };
      default: return { icon: Sparkles, label: cat, badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    }
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="grid gap-5 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_430px] w-full min-w-0">
        
        {/* Left Column: Menu Catalog Cockpit */}
        <div className="space-y-4 w-full min-w-0 pb-28 lg:pb-6">
          
          {/* Square-style Category Cards */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar w-full min-w-0">
            {categories.map((cat) => {
              const active = selectedCat === cat;
              const { icon: CatIcon } = getCatMeta(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-2 whitespace-nowrap shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                      : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-slate-400/30"
                  }`}
                >
                  <CatIcon size={14} className={active ? "text-white" : "text-[var(--muted)]"} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Product Cards — High-density, Luxury Hardware feel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              const inCartCount = items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.qty, 0);
              const { badge } = getCatMeta(product.category);

              return (
                <div
                  key={product.id}
                  className={`group relative flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-all duration-150 hover:border-[var(--brand)] hover:shadow-lg ${
                    outOfStock ? "opacity-40 grayscale" : ""
                  } ${inCartCount > 0 ? "border-[var(--brand-border)] bg-[var(--brand-soft)]/20" : ""}`}
                >
                  <div>
                    {/* Top Metadata Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge}`}>
                        {product.category}
                      </span>
                      {product.trackStock && (
                        <span className={`text-[10px] font-bold tabular ${product.stock <= 5 ? "text-amber-500" : "text-[var(--muted)]"}`}>
                          Stok: {product.stock}
                        </span>
                      )}
                    </div>

                    {/* Product Name & Pricing */}
                    <h3 className="mt-2 text-sm font-bold text-[var(--ink)] leading-snug break-words group-hover:text-[var(--brand-dark)] transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-baseline justify-between">
                      <p className="text-base font-black text-[var(--ink)] tabular">
                        <span className="text-xs font-bold text-[var(--muted)] mr-0.5">Rp</span>
                        {product.price.toLocaleString("id-ID")}
                      </p>
                      {inCartCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                          {inCartCount} di keranjang
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Variant Selection or Direct Add */}
                  {product.variants?.length ? (
                    <div className="mt-3.5 pt-2.5 border-t border-[var(--line)]">
                      <p className="text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">Varian</p>
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
                      className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--surface-2)] py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--brand)] hover:text-white transition-all active:scale-95"
                    >
                      <Plus size={14} /> Tambah Menu
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Order Pane (Square / Toast Inspired) */}
        <div className="hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 lg:flex lg:flex-col h-[calc(100vh-95px)] sticky top-20 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm">Pesanan Kasir</h2>
                <p className="text-[11px] text-[var(--muted)]">{totals.units} item dalam nota</p>
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-xs font-bold text-[var(--danger)] hover:underline">
                Kosongkan
              </button>
            )}
          </div>

          <div className="my-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-xs text-[var(--muted)] p-6">
                <div className="space-y-2">
                  <ShoppingBag size={32} className="mx-auto text-[var(--muted)]/40" />
                  <p className="font-bold text-[var(--ink-soft)]">Belum Ada Item</p>
                  <p className="text-[11px] text-[var(--muted)]">Sentuh produk di sebelah kiri untuk memasukkan ke struk.</p>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-[var(--ink)]">{item.name}</h4>
                        {item.variant && (
                          <span className="inline-block mt-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--muted)]">
                            Varian: {item.variant}
                          </span>
                        )}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-[var(--muted)] hover:text-[var(--danger)] p-1 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-1 shadow-2xs">
                        <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Minus size={11} /></button>
                        <span className="w-5 text-center text-xs font-bold tabular">{item.qty}</span>
                        <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Plus size={11} /></button>
                      </div>
                      <span className="text-xs font-black tabular text-[var(--brand-dark)]">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
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
            {totals.discount > 0 && (
              <div className="flex justify-between text-xs text-[var(--danger)]">
                <span>Diskon</span>
                <span className="font-bold tabular">-Rp {totals.discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black">
              <span>Total Tagihan</span>
              <span className="text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => setPayOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-[var(--brand-hover)] active:scale-98 transition-all disabled:opacity-40"
            >
              Bayar Pesanan <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Floating Cart Dock */}
        {items.length > 0 && (
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-3xl bg-[var(--surface)] border border-[var(--line)] p-3 text-[var(--ink)] shadow-2xl lg:hidden">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2.5 text-left min-w-0 pr-2 flex-1"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <ShoppingBag size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] text-[var(--muted)] font-bold">
                  <span>{totals.units} item di keranjang</span>
                  <ChevronUp size={13} />
                </div>
                <p className="text-base font-black tabular truncate text-[var(--brand-dark)]">
                  Rp {totals.total.toLocaleString("id-ID")}
                </p>
              </div>
            </button>
            <button
              onClick={() => setPayOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-xs font-bold text-white shadow-sm shrink-0 active:scale-95"
            >
              Bayar <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Mobile Full Cart Drawer / Bottom Sheet */}
        {cartDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 lg:hidden flex flex-col justify-end backdrop-blur-xs"
            onClick={() => setCartDrawerOpen(false)}
          >
            <div
              className="w-full bg-[var(--surface)] rounded-t-3xl max-h-[82vh] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-[var(--line)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Rincian Keranjang</h3>
                    <p className="text-[11px] text-[var(--muted)]">{totals.units} item dipilih</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button onClick={clear} className="text-xs font-bold text-[var(--danger)] px-2 py-1 hover:bg-rose-500/10 rounded-lg">
                      Kosongkan
                    </button>
                  )}
                  <button onClick={() => setCartDrawerOpen(false)} className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)]">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="my-3 flex-1 space-y-2.5 overflow-y-auto max-h-[48vh] pr-1">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[var(--ink)] break-words">{item.name}</h4>
                          {item.variant && (
                            <span className="inline-block mt-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                              Varian: {item.variant}
                            </span>
                          )}
                        </div>
                        <button onClick={() => remove(item.id)} className="text-[var(--muted)] hover:text-[var(--danger)] p-1 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 shadow-2xs">
                          <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Minus size={13} /></button>
                          <span className="w-7 text-center text-sm font-bold tabular">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Plus size={13} /></button>
                        </div>
                        <span className="text-sm font-black text-[var(--brand-dark)] tabular">
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
                  <span>Total Tagihan</span>
                  <span className="text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
                </div>
                <button
                  disabled={items.length === 0}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setPayOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 active:scale-98 disabled:opacity-40"
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
