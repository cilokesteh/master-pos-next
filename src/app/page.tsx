"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BarChart3, BookOpenCheck, Boxes, Clock3, Cloud, Menu, Moon, Search, ShoppingBasket, Sun, Wifi, WifiOff, X } from "lucide-react";
import { db } from "@/lib/db";
import { initDatabaseDefaults } from "@/lib/seed";
import { useCart } from "@/lib/cart-store";
import CashierView from "@/components/CashierView";
import ReportsView from "@/components/ReportsView";
import ShiftView from "@/components/ShiftView";
import KasbonView from "@/components/KasbonView";
import ProductsView from "@/components/ProductsView";
import SyncSettingsView from "@/components/SyncSettingsView";

type View = "kasir" | "laporan" | "shift" | "produk" | "kasbon" | "sync";

export default function Home() {
  const [view, setView] = useState<View>("kasir");
  const [online, setOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), [], []);
  const cartUnits = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  useEffect(() => {
    initDatabaseDefaults();
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    // Initial Theme load
    const savedTheme = localStorage.getItem("pos_theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pos_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pos_theme", "light");
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q));
  }, [products, query]);

  const allNav = [
    { id: "kasir" as const, label: "Kasir", icon: ShoppingBasket },
    { id: "laporan" as const, label: "Laporan", icon: BarChart3 },
    { id: "kasbon" as const, label: "Kasbon", icon: BookOpenCheck },
    { id: "shift" as const, label: "Shift", icon: Clock3 },
    { id: "produk" as const, label: "Produk", icon: Boxes },
    { id: "sync" as const, label: "Backup", icon: Cloud },
  ];

  const mobileNav = [
    { id: "kasir" as const, label: "Kasir", icon: ShoppingBasket },
    { id: "laporan" as const, label: "Laporan", icon: BarChart3 },
    { id: "kasbon" as const, label: "Kasbon", icon: BookOpenCheck },
  ];

  const handleSelectView = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <main className="min-h-screen zen-grid pb-24 lg:pb-0 w-full max-w-full overflow-x-hidden transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl w-full">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand)] font-black text-white text-xs sm:text-sm">
            MP
          </div>
          <div className="min-w-0 pr-1 hidden sm:block">
            <h1 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">Master POS</h1>
            <p className="text-[10px] text-[var(--muted)]">Warung & F&B</p>
          </div>

          {view === "kasir" && (
            <label className="relative flex-1 min-w-0 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari menu, sembako, atau barcode..."
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] py-2 pl-8.5 pr-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all"
              />
            </label>
          )}

          {/* Online / Offline Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${online ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "bg-amber-500/10 text-amber-500"}`}>
            {online ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{online ? "Online" : "Offline"}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:border-slate-400/30 transition-all shrink-0"
            title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--ink)]"
            aria-label="Menu navigasi"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden flex justify-end" onClick={() => setMenuOpen(false)}>
          <div className="w-64 bg-[var(--surface)] h-full p-4 space-y-2 flex flex-col border-l border-[var(--line)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold text-sm">Menu Utama</h3>
              <button onClick={() => setMenuOpen(false)} className="text-[var(--muted)]"><X size={18}/></button>
            </div>
            <nav className="space-y-1 flex-1 pt-2">
              {allNav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelectView(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-all ${view === id ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]">
              Master POS UMKM • Zen Luxe v13.0
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="mx-auto flex max-w-[1600px] w-full min-w-0">
        {/* Desktop Sidebar */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 border-r border-[var(--line)] p-4 lg:block">
          <nav className="space-y-1.5">
            {allNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-bold transition-all ${view === id ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Views */}
        <section className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden">
          {view === "kasir" && <CashierView products={filtered} query={query} setQuery={setQuery} />}
          {view === "laporan" && <ReportsView />}
          {view === "shift" && <ShiftView />}
          {view === "produk" && <ProductsView />}
          {view === "kasbon" && <KasbonView />}
          {view === "sync" && <SyncSettingsView />}
        </section>
      </div>

      {/* Mobile Clean Bottom Nav Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--surface)]/95 px-1 safe-bottom backdrop-blur-xl lg:hidden">
        {mobileNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSelectView(id)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition-colors ${view === id ? "text-[var(--brand-dark)]" : "text-[var(--muted)]"}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === "kasir" && cartUnits > 0 && (
              <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-cta)] px-1 text-[9px] font-black text-white">
                {cartUnits}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold ${["shift", "produk", "sync"].includes(view) ? "text-[var(--brand-dark)]" : "text-[var(--muted)]"}`}
        >
          <Menu size={18} />
          <span>Lainnya</span>
        </button>
      </nav>
    </main>
  );
}
