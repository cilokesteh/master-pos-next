"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ChevronUp,
  X,
  Utensils,
  Coffee,
  Cookie,
  ShoppingCart,
  Flame,
  Sparkles,
  Tag,
  ReceiptText,
} from "lucide-react";
import type { Product } from "@/lib/db";
import { useCart } from "@/lib/cart-store";
import { calculateCartTotals } from "@/lib/domain.mjs";
import PaymentModal from "./PaymentModal";

export default function CashierView({
  products,
  query,
  setQuery,
}: {
  products: Product[];
  query: string;
  setQuery: (q: string) => void;
}) {
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [payOpen, setPayOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const { items, add, changeQty, remove, discount, clear } = useCart();

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );
  const visible = useMemo(
    () => (selectedCat === "Semua" ? products : products.filter((p) => p.category === selectedCat)),
    [products, selectedCat]
  );
  const totals = useMemo(() => calculateCartTotals(items, discount), [items, discount]);

  const getCatConfig = (cat: string) => {
    switch (cat) {
      case "Makanan":
        return {
          icon: Utensils,
          color: "text-amber-600 dark:text-amber-400",
          barColor: "bg-amber-500",
          bgLight: "bg-amber-500/10",
        };
      case "Minuman":
        return {
          icon: Coffee,
          color: "text-cyan-600 dark:text-cyan-400",
          barColor: "bg-cyan-500",
          bgLight: "bg-cyan-500/10",
        };
      case "Snack":
        return {
          icon: Cookie,
          color: "text-orange-600 dark:text-orange-400",
          barColor: "bg-orange-500",
          bgLight: "bg-orange-500/10",
        };
      case "Sembako":
        return {
          icon: ShoppingCart,
          color: "text-emerald-600 dark:text-emerald-400",
          barColor: "bg-emerald-500",
          bgLight: "bg-emerald-500/10",
        };
      case "Rokok":
        return {
          icon: Flame,
          color: "text-slate-600 dark:text-slate-400",
          barColor: "bg-slate-500",
          bgLight: "bg-slate-500/10",
        };
      default:
        return {
          icon: Sparkles,
          color: "text-indigo-600 dark:text-indigo-400",
          barColor: "bg-indigo-500",
          bgLight: "bg-indigo-500/10",
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
          <div className="flex gap-2 overflow-x-auto p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xs no-scrollbar w-full min-w-0">
            {categories.map((cat) => {
              const active = selectedCat === cat;
              const { icon: CatIcon, color, bgLight } = getCatConfig(cat);
              const count =
                cat === "Semua"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-2 whitespace-nowrap shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-97 cursor-pointer ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-xs font-extrabold"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <CatIcon size={14} className={active ? "text-white" : color} />
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] tabular font-black ${
                      active
                        ? "bg-black/25 text-white"
                        : "bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* COMPACT TACTILE RETAIL TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
            {visible.map((product) => {
              const outOfStock = product.trackStock && product.stock <= 0;
              const inCartCount = items
                .filter((i) => i.productId === product.id)
                .reduce((sum, i) => sum + i.qty, 0);
              const { barColor, color, bgLight } = getCatConfig(product.category);

              return (
                <button
                  key={product.id}
                  disabled={outOfStock}
                  onClick={() => handleCardClick(product)}
                  className={`group relative flex flex-col justify-between min-h-[96px] sm:min-h-[102px] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-3.5 text-left transition-all duration-150 active:scale-[0.97] select-none shadow-card hover:shadow-md cursor-pointer overflow-hidden ${
                    outOfStock
                      ? "opacity-35 grayscale cursor-not-allowed bg-[var(--surface-2)]"
                      : "hover:border-[var(--brand)]"
                  } ${
                    inCartCount > 0
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]/25 ring-2 ring-[var(--brand)]/30"
                      : ""
                  }`}
                >
                  {/* Category Indicator Pill on top right */}
                  <div
                    className={`absolute top-0 right-0 h-1.5 w-12 rounded-bl-lg ${barColor}`}
                  />

                  {/* Top: Product Name & Badges */}
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-xs sm:text-[13px] font-extrabold text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--brand-dark)] transition-colors">
                        {product.name}
                      </h3>
                      {inCartCount > 0 && (
                        <span className="shrink-0 flex items-center justify-center h-5 min-w-5 rounded-lg bg-[var(--brand)] px-1.5 text-[11px] font-black text-white shadow-xs animate-in zoom-in-75 duration-150">
                          {inCartCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-medium text-[var(--muted)]">
                        {product.category}
                      </span>
                      {product.variants?.length ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[var(--brand-dark)] bg-[var(--brand-soft)] px-1.5 py-0.5 rounded-md">
                          <Tag size={9} /> {product.variants.length} Varian
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Bottom: Clear Tabular Price & Stock Indicator */}
                  <div className="w-full mt-3 flex items-baseline justify-between border-t border-[var(--line-soft)] pt-2">
                    <div className="flex items-baseline">
                      <span className="text-[11px] font-bold text-[var(--muted)] mr-0.5">
                        Rp
                      </span>
                      <span className="text-sm sm:text-base font-black text-[var(--ink)] tabular tracking-tight">
                        {product.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {product.trackStock && (
                      <span
                        className={`text-[10px] font-bold tabular px-1.5 py-0.5 rounded-md ${
                          product.stock <= 5
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold"
                            : "bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        {product.stock <= 5 ? `Sisa ${product.stock}` : `Stok ${product.stock}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Order Pane */}
        <div className="hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 lg:flex lg:flex-col h-[calc(100vh-90px)] sticky top-[72px] shadow-sm">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ReceiptText size={18} />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-[var(--ink)]">Pesanan Kasir</h2>
                <p className="text-[11px] text-[var(--muted)] font-medium">
                  {totals.units} item dalam nota aktif
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-[11px] font-bold text-[var(--danger)] hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="my-3 flex-1 space-y-2 overflow-y-auto pr-1 no-scrollbar">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center p-6">
                <div className="space-y-2 max-w-[240px]">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)]">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="font-extrabold text-[var(--ink)] text-sm">Keranjang Kosong</p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Sentuh menu atau sembako di katalog untuk memasukkan ke struk belanja.
                  </p>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-[var(--ink)]">
                          {item.name}
                        </h4>
                        {item.variant && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                            Varian: {item.variant}
                          </span>
                        )}
                        <p className="text-[11px] text-[var(--muted)] tabular mt-0.5">
                          @ Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-[var(--muted)] hover:text-[var(--danger)] hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors shrink-0"
                        title="Hapus item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[var(--line-soft)] pt-2">
                      <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 shadow-2xs">
                        <button
                          onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)}
                          className="p-1 text-[var(--ink)] hover:text-[var(--danger)] active:scale-90"
                          aria-label="Kurangi"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-black tabular">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)}
                          className="p-1 text-[var(--ink)] hover:text-[var(--brand)] active:scale-90"
                          aria-label="Tambah"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-black tabular text-[var(--ink)]">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer Summary */}
          <div className="border-t border-[var(--line)] pt-3.5 space-y-2">
            <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
              <span>Subtotal Item</span>
              <span className="font-bold tabular text-[var(--ink)]">
                Rp {totals.subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-xs text-[var(--danger)] font-bold">
                <span>Diskon Promo</span>
                <span className="tabular">- Rp {totals.discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-[var(--line-soft)]">
              <span className="text-xs font-bold text-[var(--muted)]">Total Pembayaran</span>
              <span className="text-xl font-black text-[var(--brand-dark)] tabular">
                <span className="text-xs font-normal text-[var(--muted)] mr-1">Rp</span>
                {totals.total.toLocaleString("id-ID")}
              </span>
            </div>

            <button
              disabled={items.length === 0}
              onClick={() => setPayOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3.5 font-extrabold text-xs sm:text-sm text-white shadow-md active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Bayar Pesanan</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Floating Cart Action Dock */}
        {items.length > 0 && (
          <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-2xl bg-[var(--surface)]/95 border border-[var(--line)] p-3 text-[var(--ink)] shadow-xl backdrop-blur-md lg:hidden">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-3 text-left min-w-0 pr-2 flex-1"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag size={19} />
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
              className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-xs font-black text-white shadow-sm shrink-0 active:scale-95 cursor-pointer"
            >
              <span>Bayar</span> <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Mobile Expandable Cart Bottom Sheet */}
        {cartDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end lg:hidden animate-in fade-in duration-150"
            onClick={() => setCartDrawerOpen(false)}
          >
            <div
              className="w-full bg-[var(--surface)] rounded-t-3xl max-h-[85vh] flex flex-col p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-[var(--line)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <ReceiptText size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[var(--ink)]">Rincian Keranjang</h3>
                    <p className="text-[10px] text-[var(--muted)]">{totals.units} item dipilih</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={clear}
                      className="text-[11px] font-bold text-[var(--danger)] px-2.5 py-1 hover:bg-rose-500/10 rounded-lg"
                    >
                      Hapus Semua
                    </button>
                  )}
                  <button
                    onClick={() => setCartDrawerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)]"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="my-3 flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[var(--ink)] break-words">
                            {item.name}
                          </h4>
                          {item.variant && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                              Varian: {item.variant}
                            </span>
                          )}
                          <p className="text-[11px] text-[var(--muted)] tabular mt-0.5">
                            @ Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-[var(--muted)] hover:text-[var(--danger)] p-1 shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-[var(--line-soft)] pt-2">
                        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1">
                          <button
                            onClick={() => changeQty(item.id, item.qty - 1, product?.stock || 0)}
                            className="text-[var(--ink)] active:scale-90"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center text-xs font-black tabular">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => changeQty(item.id, item.qty + 1, product?.stock || 0)}
                            className="text-[var(--ink)] active:scale-90"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-sm font-black text-[var(--ink)] tabular">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--line)] pt-3 space-y-2">
                <div className="flex justify-between text-xs text-[var(--muted)] font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold tabular text-[var(--ink)]">
                    Rp {totals.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-[var(--muted)]">Total Tagihan</span>
                  <span className="text-lg font-black text-[var(--brand-dark)] tabular">
                    Rp {totals.total.toLocaleString("id-ID")}
                  </span>
                </div>
                <button
                  disabled={items.length === 0}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setPayOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3.5 font-extrabold text-sm text-white shadow-md active:scale-98 disabled:opacity-40"
                >
                  <span>Lanjut Pembayaran</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variant Selection Modal */}
        {variantModalProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
            onClick={() => setVariantModalProduct(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--ink)]">
                    {variantModalProduct.name}
                  </h3>
                  <p className="text-xs font-black text-[var(--brand-dark)] tabular mt-0.5">
                    Rp {variantModalProduct.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => setVariantModalProduct(null)}
                  className="p-1 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-2)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-3.5">
                <p className="text-[10px] font-extrabold text-[var(--muted)] mb-2.5 uppercase tracking-wider">
                  PILIH VARIAN MENU:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {variantModalProduct.variants?.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        add(variantModalProduct, v);
                        setVariantModalProduct(null);
                      }}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-dark)] active:scale-95 transition-all text-center cursor-pointer shadow-2xs"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {payOpen && (
          <PaymentModal totals={totals} items={items} onClose={() => setPayOpen(false)} />
        )}
      </div>
    </div>
  );
}
