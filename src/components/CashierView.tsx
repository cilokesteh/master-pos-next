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
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const { items, add, changeQty, remove, discount, clear } = useCart();

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visible = useMemo(() => selectedCat === "Semua" ? products : products.filter((p) => p.category === selectedCat), [products, selectedCat]);
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);

  // Visual Category Styling & Large Graphic Accents
  const getCatStyle = (cat: string) => {
    switch (cat) {
      case "Makanan":
        return {
          icon: Utensils,
          badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
          gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
          bgHover: "hover:border-rose-500/50",
          color: "text-rose-500",
        };
      case "Minuman":
        return {
          icon: Coffee,
          badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
          bgHover: "hover:border-amber-500/50",
          color: "text-amber-500",
        };
      case "Snack":
        return {
          icon: Cookie,
          badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
          gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
          bgHover: "hover:border-orange-500/50",
          color: "text-orange-500",
        };
      case "Sembako":
        return {
          icon: ShoppingCart,
          badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
          bgHover: "hover:border-emerald-500/50",
          color: "text-emerald-500",
        };
      case "Rokok":
        return {
          icon: Flame,
          badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          gradient: "from-slate-500/10 via-slate-500/5 to-transparent",
          bgHover: "hover:border-slate-400/50",
          color: "text-slate-400",
        };
      default:
        return {
          icon: Sparkles,
          badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
          bgHover: "hover:border-blue-500/50",
          color: "text-blue-500",
        };
    }
  };

  const handleCardClick = (product: Product) => {
    if (product.trackStock && product.stock <= 0) return;
    if (product.variants?.length) {
      setVariantModalProduct(product);
    } else {
      add(product);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="grid gap-5 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_430px] w-full min-w-0">
        
        {/* Left Column: Menu Catalog Cockpit */}
        <div className="space-y-4 w-full min-w-0 pb-28 lg:pb-6">
          
          {/* Segmented Category Filter Bar */}
          <div className="flex gap-2 overflow-x-auto p-1.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--line)] no-scrollbar w-full min-w-0">
            {categories.map((cat) => {
              const active = selectedCat === cat;
              const { icon: CatIcon } = getCatStyle(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm font-black scale-[1.02] border border-[var(--line)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <CatIcon size={14} className={active ? "text-[var(--brand)]" : "text-[var(--muted)]"} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* HIGH-PRECISION SQUARE TILE GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              const inCartCount = items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.qty, 0);
              const { icon: CatIcon, badge, gradient, color } = getCatStyle(product.category);

              return (
                <button
                  key={product.id}
                  disabled={outOfStock}
                  onClick={() => handleCardClick(product)}
                  className={`group relative flex flex-col justify-between aspect-square rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-3.5 text-left transition-all duration-150 active:scale-[0.96] overflow-hidden select-none shadow-xs ${
                    outOfStock ? "opacity-30 grayscale cursor-not-allowed" : "hover:border-[var(--brand)] hover:shadow-md cursor-pointer"
                  } ${inCartCount > 0 ? "border-[var(--brand)] ring-2 ring-[var(--brand-border)] bg-[var(--brand-soft)]/20" : ""}`}
                >
                  {/* Atmospheric Category Gradient Backdrop */}
                  <div className={`absolute top-0 right-0 left-0 h-16 bg-gradient-to-b ${gradient} opacity-80 pointer-events-none`} />

                  {/* Watermark Big Background Category Icon */}
                  <div className="absolute top-2 right-2 opacity-[0.06] dark:opacity-[0.08] pointer-events-none">
                    <CatIcon size={64} className={color} />
                  </div>

                  {/* Top Row: Mini Category Badge + Stock / Cart Counter */}
                  <div className="relative z-10 flex items-start justify-between w-full gap-1">
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${badge}`}>
                        {product.category}
                      </span>
                    </div>

                    {inCartCount > 0 ? (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 duration-150">
                        {inCartCount}
                      </span>
                    ) : product.trackStock ? (
                      <span className={`text-[9px] font-bold tabular px-1.5 py-0.5 rounded-md ${product.stock <= 5 ? "bg-amber-500/10 text-amber-500" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
                        Stok {product.stock}
                      </span>
                    ) : null}
                  </div>

                  {/* Center: Title & Variant Info */}
                  <div className="relative z-10 my-auto py-1 w-full">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--brand-dark)] transition-colors">
                      {product.name}
                    </h3>
                    {product.variants?.length ? (
                      <span className="inline-block text-[10px] text-[var(--brand-dark)] font-semibold mt-1 bg-[var(--brand-soft)]/40 px-1.5 py-0.5 rounded-md">
                        {product.variants.length} Varian Rasa
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom: Price Tag Bar */}
                  <div className="relative z-10 w-full pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[var(--muted)]">Harga</span>
                    <span className="text-xs sm:text-sm font-black text-[var(--ink)] tabular tracking-tight">
                      <span className="text-[10px] text-[var(--muted)] font-normal mr-0.5">Rp</span>
                      {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </button>
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
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-3xl bg-[var(--surface)]/95 border border-[var(--line)] p-3 text-[var(--ink)] shadow-2xl backdrop-blur-md lg:hidden">
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

        {/* Modal Pilihan Varian Rasa/Suhu (Clean Apple Glass Pop-up) */}
        {variantModalProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setVariantModalProduct(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)]">{variantModalProduct.name}</h3>
                  <p className="text-xs font-black text-[var(--brand-dark)] tabular mt-0.5">
                    Rp {variantModalProduct.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <button onClick={() => setVariantModalProduct(null)} className="p-1.5 rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)]">
                  <X size={18} />
                </button>
              </div>

              <div className="py-4">
                <p className="text-xs font-bold text-[var(--muted)] mb-3 uppercase tracking-wider">PILIH VARIAN MENU:</p>
                <div className="grid grid-cols-2 gap-2">
                  {variantModalProduct.variants?.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        add(variantModalProduct, v);
                        setVariantModalProduct(null);
                      }}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs font-bold text-[var(--ink)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)] active:scale-95 transition-all text-center"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {payOpen && <PaymentModal totals={totals} items={items} onClose={() => setPayOpen(false)} />}
      </div>
    </div>
  );
}
