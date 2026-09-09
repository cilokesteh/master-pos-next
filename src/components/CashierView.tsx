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

  const getCatStyle = (cat: string) => {
    switch (cat) {
      case "Makanan": return { icon: Utensils, badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
      case "Minuman": return { icon: Coffee, badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      case "Snack": return { icon: Cookie, badge: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
      case "Sembako": return { icon: ShoppingCart, badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case "Rokok": return { icon: Flame, badge: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
      default: return { icon: Sparkles, badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
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
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] w-full min-w-0">
        
        {/* Left Column: Menu Catalog Cockpit */}
        <div className="space-y-3.5 w-full min-w-0 pb-28 lg:pb-6">
          
          {/* Segmented Category Filter Bar */}
          <div className="flex gap-1.5 overflow-x-auto p-1 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--line)] no-scrollbar w-full min-w-0">
            {categories.map((cat) => {
              const active = selectedCat === cat;
              const { icon: CatIcon } = getCatStyle(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                    active
                      ? "bg-[var(--surface)] text-[var(--ink)] font-black shadow-2xs border border-[var(--line)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <CatIcon size={13} className={active ? "text-[var(--brand)]" : "text-[var(--muted)]"} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* COMPACT RETAIL TILES (Toast/Square Style: dense, tactile, non-square) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              const inCartCount = items.filter((i) => i.productId === product.id).reduce((sum, i) => sum + i.qty, 0);

              return (
                <button
                  key={product.id}
                  disabled={outOfStock}
                  onClick={() => handleCardClick(product)}
                  className={`group relative flex flex-col justify-between min-h-[82px] sm:min-h-[88px] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2.5 sm:p-3 text-left transition-all duration-100 active:scale-[0.97] select-none ${
                    outOfStock ? "opacity-30 grayscale cursor-not-allowed" : "hover:border-[var(--brand)] hover:shadow-sm cursor-pointer"
                  } ${inCartCount > 0 ? "border-[var(--brand)] bg-[var(--brand-soft)]/20 ring-1 ring-[var(--brand-border)]" : ""}`}
                >
                  {/* Top: Name & Badges */}
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--brand-dark)] transition-colors">
                        {product.name}
                      </h3>
                      {inCartCount > 0 ? (
                        <span className="shrink-0 flex items-center justify-center h-4.5 min-w-4.5 rounded-md bg-[var(--brand)] px-1 text-[10px] font-black text-white">
                          {inCartCount}
                        </span>
                      ) : product.trackStock && product.stock <= 5 ? (
                        <span className="shrink-0 text-[9px] font-bold tabular px-1 rounded bg-amber-500/10 text-amber-500">
                          {product.stock}
                        </span>
                      ) : null}
                    </div>

                    {product.variants?.length ? (
                      <span className="inline-block text-[9px] text-[var(--muted)] font-medium mt-0.5">
                        {product.variants.length} Varian
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom: Clear Tabular Price */}
                  <div className="w-full mt-2 flex items-baseline justify-between">
                    <span className="text-xs sm:text-[13px] font-black text-[var(--ink)] tabular tracking-tight">
                      <span className="text-[10px] text-[var(--muted)] font-normal mr-0.5">Rp</span>
                      {product.price.toLocaleString("id-ID")}
                    </span>
                    {product.trackStock && product.stock > 5 && (
                      <span className="text-[9px] text-[var(--muted)] tabular">
                        sisa {product.stock}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Order Pane */}
        <div className="hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 lg:flex lg:flex-col h-[calc(100vh-95px)] sticky top-20 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h2 className="font-bold text-xs">Pesanan Kasir</h2>
                <p className="text-[10px] text-[var(--muted)]">{totals.units} item dalam nota</p>
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-[11px] font-bold text-[var(--danger)] hover:underline">
                Kosongkan
              </button>
            )}
          </div>

          <div className="my-2.5 flex-1 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-xs text-[var(--muted)] p-6">
                <div className="space-y-1.5">
                  <ShoppingBag size={28} className="mx-auto text-[var(--muted)]/40" />
                  <p className="font-bold text-[var(--ink-soft)] text-xs">Keranjang Kosong</p>
                  <p className="text-[10px] text-[var(--muted)]">Sentuh produk di sebelah kiri untuk memasukkan ke struk.</p>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/60 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-[var(--ink)]">{item.name}</h4>
                        {item.variant && (
                          <span className="inline-block mt-0.5 text-[9px] font-medium text-[var(--muted)]">
                            Varian: {item.variant}
                          </span>
                        )}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-[var(--muted)] hover:text-[var(--danger)] p-0.5 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5">
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

          <div className="border-t border-[var(--line)] pt-3 space-y-1.5">
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
            <div className="flex justify-between text-sm font-black pt-1">
              <span>Total Tagihan</span>
              <span className="text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => setPayOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 font-bold text-xs text-white shadow-sm hover:bg-[var(--brand-hover)] active:scale-98 transition-all disabled:opacity-40"
            >
              Bayar Pesanan <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Mobile Floating Cart Dock */}
        {items.length > 0 && (
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-xl bg-[var(--surface)]/95 border border-[var(--line)] p-2.5 text-[var(--ink)] shadow-xl backdrop-blur-md lg:hidden">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2.5 text-left min-w-0 pr-2 flex-1"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                <ShoppingBag size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-bold">
                  <span>{totals.units} item di keranjang</span>
                  <ChevronUp size={12} />
                </div>
                <p className="text-sm font-black tabular truncate text-[var(--brand-dark)]">
                  Rp {totals.total.toLocaleString("id-ID")}
                </p>
              </div>
            </button>
            <button
              onClick={() => setPayOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white shadow-xs shrink-0 active:scale-95"
            >
              Bayar <ArrowRight size={13} />
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
              className="w-full bg-[var(--surface)] rounded-t-2xl max-h-[82vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-150 border-t border-[var(--line)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--brand-soft)] text-[var(--brand)]">
                    <ShoppingBag size={15} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">Rincian Keranjang</h3>
                    <p className="text-[10px] text-[var(--muted)]">{totals.units} item dipilih</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button onClick={clear} className="text-[11px] font-bold text-[var(--danger)] px-2 py-0.5 hover:bg-rose-500/10 rounded-md">
                      Kosongkan
                    </button>
                  )}
                  <button onClick={() => setCartDrawerOpen(false)} className="p-1 rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)]">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="my-2.5 flex-1 space-y-2 overflow-y-auto max-h-[48vh] pr-1">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/60 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[var(--ink)] break-words">{item.name}</h4>
                          {item.variant && (
                            <span className="inline-block mt-0.5 text-[9px] font-medium text-[var(--muted)]">
                              Varian: {item.variant}
                            </span>
                          )}
                        </div>
                        <button onClick={() => remove(item.id)} className="text-[var(--muted)] hover:text-[var(--danger)] p-1 shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5">
                          <button onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Minus size={12} /></button>
                          <span className="w-5 text-center text-xs font-bold tabular">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)} className="text-[var(--ink)] active:scale-90"><Plus size={12} /></button>
                        </div>
                        <span className="text-xs font-black text-[var(--brand-dark)] tabular">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--line)] pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span className="font-bold tabular text-[var(--ink)]">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm font-black">
                  <span>Total Tagihan</span>
                  <span className="text-[var(--brand-dark)] tabular">Rp {totals.total.toLocaleString("id-ID")}</span>
                </div>
                <button
                  disabled={items.length === 0}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setPayOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 font-bold text-xs text-white shadow-sm active:scale-98 disabled:opacity-40"
                >
                  Lanjut Pembayaran <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pilihan Varian Rasa/Suhu */}
        {variantModalProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setVariantModalProduct(null)}
          >
            <div
              className="w-full max-w-sm rounded-[12px] bg-[var(--surface)] border border-[var(--line)] p-4 shadow-2xl animate-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-2.5 border-b border-[var(--line)]">
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)]">{variantModalProduct.name}</h3>
                  <p className="text-xs font-black text-[var(--brand-dark)] tabular mt-0.5">
                    Rp {variantModalProduct.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <button onClick={() => setVariantModalProduct(null)} className="p-1 rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)]">
                  <X size={16} />
                </button>
              </div>

              <div className="py-3">
                <p className="text-[10px] font-bold text-[var(--muted)] mb-2 uppercase tracking-wider">PILIH VARIAN:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {variantModalProduct.variants?.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        add(variantModalProduct, v);
                        setVariantModalProduct(null);
                      }}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs font-bold text-[var(--ink)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)] active:scale-95 transition-all text-center"
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
