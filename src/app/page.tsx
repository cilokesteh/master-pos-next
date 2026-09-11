"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  Clock3,
  Cloud,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Store,
  Sun,
  UserCheck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState("");

  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), [], []);
  const currentShift = useLiveQuery(() => db.shifts.where("status").equals("open").first(), [], null);
  const cartUnits = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  useEffect(() => {
    initDatabaseDefaults();
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    // Live clock update
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
          " WIB"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);

    // Initial Theme load
    const savedTheme = localStorage.getItem("pos_theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      clearInterval(timer);
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
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q)
    );
  }, [products, query]);

  const allNav = [
    { id: "kasir" as const, label: "Kasir", icon: ShoppingBag, desc: "Katalog & Transaksi" },
    { id: "laporan" as const, label: "Laporan", icon: BarChart3, desc: "Rekap & Omzet" },
    { id: "kasbon" as const, label: "Kasbon", icon: BookOpenCheck, desc: "Piutang Pelanggan" },
    { id: "shift" as const, label: "Shift", icon: Clock3, desc: "Laci & Petty Cash" },
    { id: "produk" as const, label: "Produk", icon: Boxes, desc: "Katalog & Stok" },
    { id: "sync" as const, label: "Backup", icon: Cloud, desc: "Cadangan Offline" },
  ];

  const mobileNav = [
    { id: "kasir" as const, label: "Kasir", icon: ShoppingBag },
    { id: "laporan" as const, label: "Laporan", icon: BarChart3 },
    { id: "kasbon" as const, label: "Kasbon", icon: BookOpenCheck },
  ];

  const handleSelectView = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <main className="min-h-screen pos-bg-gradient pb-24 lg:pb-0 w-full max-w-full overflow-x-hidden transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md w-full shadow-xs">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-3.5 py-2.5 sm:px-5 lg:px-6">
          {/* Left Brand Unit */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 font-black text-white text-sm shadow-sm ring-1 ring-white/20">
              MP
            </div>
            <div className="min-w-0 pr-2 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-[var(--ink)] tracking-tight">Master POS</h1>
                <span className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-dark)]">UMKM</span>
              </div>
              <p className="text-[11px] font-medium text-[var(--muted)] flex items-center gap-1">
                <Store size={11} className="shrink-0" /> Warung & F&B
              </p>
            </div>
          </div>

          {/* Center Search / View Title Bar */}
          <div className="flex-1 min-w-0 max-w-xl mx-2">
            {view === "kasir" ? (
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari menu, sembako, atau barcode (tekan untuk ketik)..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/80 py-2 pl-9.5 pr-4 text-xs font-medium text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--brand-border)]/30 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Modul:</span>
                <span className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wide">
                  {allNav.find((n) => n.id === view)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Clock & Shift Badge (Desktop) */}
            <div className="hidden xl:flex flex-col items-end text-right border-r border-[var(--line)] pr-3">
              <span className="text-xs font-bold text-[var(--ink)] tabular">{currentTime}</span>
              <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                <UserCheck size={11} className="text-[var(--brand)]" />
                {currentShift ? `${currentShift.cashierName} (Shift Aktif)` : "Shift Belum Dibuka"}
              </span>
            </div>

            {/* Online / Offline Indicator */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 transition-colors ${
                online
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] active:scale-95 transition-all shrink-0"
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 p-2 text-[var(--ink)] active:scale-95"
              aria-label="Menu navigasi"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden flex justify-end animate-in fade-in duration-150"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-72 bg-[var(--surface)] h-full p-4 space-y-3 flex flex-col border-l border-[var(--line)] shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 font-black text-white text-xs">
                  MP
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)]">Menu Utama</h3>
                  <p className="text-[10px] text-[var(--muted)]">Master POS Modern</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1 pt-1">
              {allNav.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => handleSelectView(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    view === id
                      ? "bg-[var(--brand)] text-white font-bold shadow-xs"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={18} className={view === id ? "text-white" : "text-[var(--muted)]"} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold leading-tight">{label}</span>
                    <span className={`block text-[10px] leading-tight mt-0.5 ${view === id ? "text-white/80" : "text-[var(--muted)]"}`}>{desc}</span>
                  </div>
                </button>
              ))}
            </nav>

            <div className="border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)] space-y-1">
              <div className="flex justify-between">
                <span>Versi:</span>
                <span className="font-bold text-[var(--ink)]">v2.0 Next-Gen</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span className="tabular">{currentTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="mx-auto flex max-w-[1600px] w-full min-w-0">
        {/* Desktop Sidebar with Modern Sleek Dock */}
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-60 shrink-0 border-r border-[var(--line)] p-3.5 lg:flex lg:flex-col justify-between">
          <nav className="space-y-1.5">
            {allNav.map(({ id, label, icon: Icon, desc }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-150 ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-sm font-bold"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]/80 hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform group-hover:scale-105 ${
                      active ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold leading-snug">{label}</span>
                  </div>
                  {active && (
                    <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Info Card */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted)] font-medium">Status Mesin:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Siap
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted)] font-medium">Koneksi:</span>
              <span className="font-bold text-[var(--ink)]">{online ? "Tersambung" : "Lokal (Offline)"}</span>
            </div>
            <div className="border-t border-[var(--line-soft)] pt-2 text-[10px] text-[var(--muted)] flex justify-between">
              <span>Master POS UMKM</span>
              <span className="font-semibold text-[var(--brand-dark)]">v2.0</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace Content */}
        <section className="min-w-0 flex-1 p-3.5 sm:p-5 lg:p-6 w-full max-w-full overflow-hidden">
          {view === "kasir" && (
            <CashierView products={filtered} query={query} setQuery={setQuery} />
          )}
          {view === "laporan" && <ReportsView />}
          {view === "shift" && <ShiftView />}
          {view === "produk" && <ProductsView />}
          {view === "kasbon" && <KasbonView />}
          {view === "sync" && <SyncSettingsView />}
        </section>
      </div>

      {/* Mobile Clean Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--surface)]/95 px-1 safe-bottom backdrop-blur-xl lg:hidden shadow-lg">
        {mobileNav.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => handleSelectView(id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition-all ${
                active ? "text-[var(--brand)] font-extrabold" : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon size={19} className={active ? "text-[var(--brand)]" : ""} />
              <span>{label}</span>
              {id === "kasir" && cartUnits > 0 && (
                <span className="absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-black text-white shadow-xs">
                  {cartUnits}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Lainnya"
          className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition-all ${
            ["shift", "produk", "sync"].includes(view)
              ? "text-[var(--brand)] font-extrabold"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <Menu size={19} />
          <span>Lainnya</span>
        </button>
      </nav>
    </main>
  );
}
