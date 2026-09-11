"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Edit2, PackagePlus, Plus, Search, Trash2, Tag, Boxes, AlertCircle } from "lucide-react";
import { db, type Product } from "@/lib/db";
import { calculateMargin, normalizeVariants, stockStatus } from "@/lib/product-domain.mjs";

export default function ProductsView() {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("10");
  const [unit, setUnit] = useState("porsi");
  const [barcode, setBarcode] = useState("");
  const [variantsStr, setVariantsStr] = useState("");
  const [trackStock, setTrackStock] = useState(true);

  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), [], []);

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCat !== "Semua") list = list.filter((p) => p.category === selectedCat);
    const q = query.toLowerCase().trim();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q));
    return list;
  }, [products, selectedCat, query]);

  const openForm = (prod?: Product) => {
    if (prod) {
      setEditing(prod);
      setName(prod.name);
      setCategory(prod.category);
      setPrice(String(prod.price));
      setCost(String(prod.cost));
      setStock(String(prod.stock));
      setUnit(prod.unit);
      setBarcode(prod.barcode || "");
      setVariantsStr((prod.variants || []).join(", "));
      setTrackStock(prod.trackStock);
    } else {
      setEditing(null);
      setName("");
      setCategory("Makanan");
      setPrice("");
      setCost("");
      setStock("10");
      setUnit("porsi");
      setBarcode("");
      setVariantsStr("");
      setTrackStock(true);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    const now = Date.now();
    const payload = {
      name: name.trim(),
      category: category.trim() || "Umum",
      price: Math.max(0, Number(price) || 0),
      cost: Math.max(0, Number(cost) || 0),
      stock: trackStock ? Math.max(0, Number(stock) || 0) : 9999,
      unit: unit.trim() || "pcs",
      barcode: barcode.trim() || undefined,
      variants: normalizeVariants(variantsStr),
      trackStock,
      updatedAt: now,
    };

    if (editing) {
      await db.products.update(editing.id, payload);
    } else {
      await db.products.add({
        id: crypto.randomUUID(),
        ...payload,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus produk ini dari database kasir?")) {
      await db.products.delete(id);
    }
  };

  const marginPreview = calculateMargin(Number(cost) || 0, Number(price) || 0);

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">Katalog Produk & Kontrol Stok</h2>
          <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Atur harga jual, HPP/modal, varian rasa, dan stok warung.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
        >
          <PackagePlus size={15} /> <span>Tambah Produk</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama produk atau scan barcode..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9.5 pr-4 text-xs font-medium outline-none focus:border-[var(--brand)] transition-all shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === c
                  ? "bg-[var(--brand)] text-white shadow-2xs font-extrabold"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Product List */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-card overflow-hidden">
        <div className="divide-y divide-[var(--line-soft)]">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--muted)]">Tidak ada produk ditemukan.</p>
          ) : (
            filtered.map((prod) => {
              const status = stockStatus(prod);
              return (
                <div
                  key={prod.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 hover:bg-[var(--surface-2)]/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[var(--ink)] leading-snug">{prod.name}</h4>
                      <span className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                        {prod.category}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] font-medium">
                      <span>Harga Jual: <strong className="text-[var(--ink)] font-black tabular">Rp {prod.price.toLocaleString("id-ID")}</strong></span>
                      <span>HPP Modal: <strong className="tabular">Rp {prod.cost.toLocaleString("id-ID")}</strong></span>
                      {prod.variants?.length ? (
                        <span className="text-[var(--brand-dark)] font-bold">Varian: {prod.variants.join(", ")}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-[var(--line-soft)] pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      {prod.trackStock ? (
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black tabular ${
                          status === "out"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : status === "low"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}>
                          {status === "out" ? "Stok Habis" : status === "low" ? `Sisa ${prod.stock}` : `Stok: ${prod.stock}`}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-[var(--muted)]">Stok Bebas (F&B)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openForm(prod)}
                        className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="rounded-xl p-2 text-[var(--muted)] hover:bg-rose-500/10 hover:text-[var(--danger)] transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Form Tambah / Edit Produk */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-2xl animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-base text-[var(--ink)] pb-3 border-b border-[var(--line)]">
              {editing ? "Edit Detail Produk" : "Tambah Produk Baru"}
            </h3>

            <div className="space-y-3 py-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1 no-scrollbar">
              <div>
                <label className="font-bold text-[var(--muted)] block mb-1">Nama Produk:</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Es Teh Manis / Beras 5kg"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[var(--muted)] block mb-1">Kategori:</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Makanan / Minuman / Sembako"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--muted)] block mb-1">Satuan:</label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="porsi / cup / pcs / kg"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[var(--muted)] block mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 tabular font-bold outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--muted)] block mb-1">Harga Modal / HPP (Rp):</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="9000"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 tabular font-bold outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-[11px] flex justify-between border border-[var(--line-soft)]">
                <span className="text-[var(--muted)] font-medium">Estimasi Margin Laba:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular">
                  Rp {marginPreview.amount.toLocaleString("id-ID")} ({marginPreview.percent}%)
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="track"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--brand)] cursor-pointer"
                />
                <label htmlFor="track" className="font-bold text-[var(--ink)] cursor-pointer">
                  Pantau Jumlah Stok Fisik (Aktifkan untuk Sembako/Kelontong)
                </label>
              </div>

              {trackStock && (
                <div>
                  <label className="font-bold text-[var(--muted)] block mb-1">Jumlah Stok Sekarang:</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 tabular font-bold outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-[var(--muted)] block mb-1">Kode Barcode (opsional):</label>
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan atau ketik kode barcode kemasan"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--muted)] block mb-1">Varian Rasa / Pilihan (pisahkan dengan koma):</label>
                <input
                  value={variantsStr}
                  onChange={(e) => setVariantsStr(e.target.value)}
                  placeholder="Contoh: Manis, Tawar, Hangat, Dingin"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[var(--line-soft)]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-xs font-bold hover:bg-[var(--surface-2)] transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={!name.trim() || !price}
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] py-2.5 text-xs font-extrabold text-white disabled:opacity-40 shadow-xs transition-all cursor-pointer"
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
