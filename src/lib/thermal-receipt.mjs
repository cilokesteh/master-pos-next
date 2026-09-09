function formatRupiah(num) {
  return Number(num || 0).toLocaleString("id-ID");
}

function center(text, width) {
  if (text.length >= width) return text.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function row(left, right, width) {
  const l = String(left || "");
  const r = String(right || "");
  const gap = width - l.length - r.length;
  if (gap >= 1) {
    return l + " ".repeat(gap) + r;
  }
  const maxLeft = Math.max(0, width - r.length - 1);
  return l.slice(0, maxLeft) + " " + r;
}

export function formatThermalReceipt(tx, store, widthMm = 58) {
  const cols = widthMm === 80 ? 46 : 32;
  const divider = "-".repeat(cols);
  const doubleDivider = "=".repeat(cols);
  const lines = [];

  lines.push(center(store.name || "WARUNG UMKM", cols));
  if (store.address) lines.push(center(store.address, cols));
  if (store.phone) lines.push(center("WA/Telp: " + store.phone, cols));
  lines.push(doubleDivider);

  lines.push(row("No: " + tx.receiptNumber, "", cols));
  const dateStr = new Date(tx.timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  lines.push(row(dateStr, tx.cashierName || "Kasir", cols));
  lines.push(divider);

  for (const item of tx.items) {
    const nameStr = item.variant ? `${item.name} (${item.variant})` : item.name;
    lines.push(nameStr.slice(0, cols));
    const qtyPrice = `${item.qty} x ${formatRupiah(item.price)}`;
    const lineTotal = formatRupiah(item.qty * item.price);
    lines.push(row("  " + qtyPrice, lineTotal, cols));
  }
  lines.push(divider);

  lines.push(row("Subtotal", formatRupiah(tx.subtotal), cols));
  if (tx.discount > 0) {
    lines.push(row("Diskon", "-" + formatRupiah(tx.discount), cols));
  }
  lines.push(doubleDivider);
  lines.push(row("TOTAL", "Rp " + formatRupiah(tx.total), cols));

  const methodMap = {
    cash: "TUNAI",
    qris: "QRIS",
    transfer: "TRANSFER",
    split: "SPLIT",
    kasbon: "KASBON",
  };
  lines.push(row("Metode", methodMap[tx.paymentMethod] || tx.paymentMethod.toUpperCase(), cols));

  if (tx.paymentMethod === "cash") {
    lines.push(row("Bayar Tunai", formatRupiah(tx.cashTendered), cols));
    lines.push(row("Kembalian", formatRupiah(tx.cashChange), cols));
  } else if (tx.paymentMethod === "kasbon") {
    lines.push(row("Pelanggan", tx.customerName || "-", cols));
    lines.push(row("Status", "BELUM LUNAS", cols));
  } else if (tx.paymentMethod === "split") {
    lines.push(row("Tunai", formatRupiah(tx.splitCash), cols));
    lines.push(row("Non-Tunai", formatRupiah(tx.splitNonCash), cols));
  }

  lines.push(divider);
  lines.push(center(store.receiptFooter || "Terima Kasih Atas Kunjungan Anda", cols));
  lines.push(center("Simpan struk ini sbg bukti sah", cols));

  return { cols, lines };
}

export function formatZReportReceipt(z, store, widthMm = 58) {
  const cols = widthMm === 80 ? 46 : 32;
  const divider = "-".repeat(cols);
  const doubleDivider = "=".repeat(cols);
  const lines = [];

  lines.push(center(store.name || "WARUNG UMKM", cols));
  lines.push(center("LAPORAN TUTUP KASIR (Z)", cols));
  lines.push(doubleDivider);

  lines.push(row("Shift ID", z.shiftId || "-", cols));
  lines.push(row("Kasir", z.cashierName || "Kasir", cols));
  if (z.startTime) {
    const s = new Date(z.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const e = z.endTime ? new Date(z.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Skrg";
    lines.push(row("Waktu", `${s} - ${e}`, cols));
  }
  lines.push(divider);

  lines.push(row("Modal Awal", formatRupiah(z.openingCash), cols));
  lines.push(row("Penjualan Tunai", formatRupiah(z.cashSales), cols));
  lines.push(row("QRIS Masuk", formatRupiah(z.qrisSales), cols));
  lines.push(row("Transfer Masuk", formatRupiah(z.transferSales), cols));
  lines.push(row("Kasbon Baru", formatRupiah(z.kasbonSales), cols));
  if (z.debtCollected > 0) {
    lines.push(row("Bayar Kasbon", formatRupiah(z.debtCollected), cols));
  }
  if (z.expenses > 0) {
    lines.push(row("Pengeluaran Kasir", "-" + formatRupiah(z.expenses), cols));
  }
  lines.push(doubleDivider);

  lines.push(row("Kas Seharusnya", "Rp " + formatRupiah(z.expectedCash), cols));
  if (z.actualCash != null) {
    lines.push(row("Kas Nyata (Hitung)", "Rp " + formatRupiah(z.actualCash), cols));
    const selisihLabel = z.difference === 0 ? "0 (PAS)" : (z.difference > 0 ? "+" : "") + formatRupiah(z.difference);
    lines.push(row("Selisih Kas", selisihLabel, cols));
  }
  lines.push(row("Total Transaksi", String(z.transactionsCount || 0), cols));

  lines.push(divider);
  lines.push(center("Laporan Sah Operasional Warung", cols));

  return { cols, lines };
}
