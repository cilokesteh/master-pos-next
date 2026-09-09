"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Edit2, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Katalog Produk & Kontrol Stok</h2>
          <p className="text-xs text-[var(--muted)]">Atur harga jual, HPP/modal, varian rasa, dan stok warung.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--brand-dark)]"
        >
          <PackagePlus size={14} /> Tambah Produk
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk atau barcode..."
            className="w-full rounded-xl border border-[var(--line)] py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap ${selectedCat === c ? "bg-[var(--brand)] text-white" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="divide-y divide-[var(--line)]">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--muted)]">Tidak ada produk ditemukan.</p>
          ) : (
            filtered.map((prod) => {
              const status = stockStatus(prod.stock, 5, prod.trackStock);
              const margin = calculateMargin(prod.cost, prod.price);
              return (
                <div key={prod.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{prod.name}</h4>
                      <span className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                        {prod.category}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                      <span>Jual: <strong className="text-[var(--ink)] tabular">Rp {prod.price.toLocaleString("id-ID")}</strong></span>
                      <span>Modal: <span className="tabular">Rp {prod.cost.toLocaleString("id-ID")}</span></span>
                      <span className="text-emerald-700 font-medium">Margin: +Rp {margin.amount.toLocaleString("id-ID")} ({margin.percent}%)</span>
                      {prod.barcode && <span>Barcode: {prod.barcode}</span>}
                    </div>
                    {prod.variants?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {prod.variants.map((v) => (
                          <span key={v} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-600">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      {prod.trackStock ? (
                        <div>
                          <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${status === "out" ? "bg-rose-100 text-rose-800" : status === "low" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {status === "out" ? "Habis (0)" : `Stok: ${prod.stock} ${prod.unit}`}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                          Stok Unlimited (F&B)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(prod)} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(prod.id)} className="rounded-lg p-2 text-[var(--muted)] hover:bg-rose-50 hover:text-[var(--danger)]">
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

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--surface)] p-5">
            <h3 className="text-base font-bold">{editing ? "Edit Produk" : "Tambah Produk Baru"}</h3>
            <div className="mt-3 space-y-2.5 max-h-[75vh] overflow-y-auto pr-1 text-xs">
              <div>
                <label className="font-bold text-[var(--muted)]">Nama Produk</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Es Teh Manis / Beras 5kg" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 outline-none focus:border-[var(--brand)]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[var(--muted)]">Kategori</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Makanan / Minuman / Sembako" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 outline-none focus:border-[var(--brand)]" />
                </div>
                <div>
                  <label className="font-bold text-[var(--muted)]">Satuan</label>
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="porsi / cup / pcs / kg" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 outline-none focus:border-[var(--brand)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[var(--muted)]">Harga Jual (Rp)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="15000" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 tabular outline-none focus:border-[var(--brand)]" />
                </div>
                <div>
                  <label className="font-bold text-[var(--muted)]">Harga Modal / HPP (Rp)</label>
                  <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="9000" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 tabular outline-none focus:border-[var(--brand)]" />
                </div>
              </div>

              {price && (
                <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-[11px]">
                  <span className="text-[var(--muted)]">Estimasi Cuan: </span>
                  <strong className="text-emerald-700 tabular">+Rp {marginPreview.amount.toLocaleString("id-ID")} ({marginPreview.percent}%)</strong>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="track" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                <label htmlFor="track" className="font-bold text-[var(--ink)]">Pantau Jumlah Stok (Warung/Sembako)</label>
              </div>

              {trackStock && (
                <div>
                  <label className="font-bold text-[var(--muted)]">Jumlah Stok Sekarang</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="10" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 tabular outline-none focus:border-[var(--brand)]" />
                </div>
              )}

              <div>
                <label className="font-bold text-[var(--muted)]">Barcode (opsional)</label>
                <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan atau ketik kode barcode" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 outline-none focus:border-[var(--brand)]" />
              </div>

              <div>
                <label className="font-bold text-[var(--muted)]">Varian / Rasa (pisahkan dengan koma)</label>
                <input value={variantsStr} onChange={(e) => setVariantsStr(e.target.value)} placeholder="Contoh: Manis, Tawar, Hangat" className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 outline-none focus:border-[var(--brand)]" />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-xs font-semibold">
                Batal
              </button>
              <button disabled={!name.trim() || !price} onClick={handleSave} className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-xs font-bold text-white disabled:opacity-40">
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
