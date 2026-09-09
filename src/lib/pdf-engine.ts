import { jsPDF } from "jspdf";

function formatRupiah(num: number | string) {
  return Number(num || 0).toLocaleString("id-ID");
}

export function generateThermalPdf(tx: any, store: any, widthMm = 58): jsPDF {
  // Margin & dimensions
  const mg = 3.5;
  const right = widthMm - mg;
  const contentWidth = right - mg;

  // We calculate dynamic height
  const baseItemsHeight = (tx.items || []).length * 9;
  const estimatedHeight = Math.max(85, 55 + baseItemsHeight + (tx.discount > 0 ? 6 : 0));

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [widthMm, estimatedHeight],
  });

  doc.setTextColor(20, 20, 20);

  let y = 6;

  // 1. Header (Store Info)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(store.name || "WARUNG BERKAH UMKM", widthMm / 2, y, { align: "center" });
  y += 4.2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (store.address) {
    const addressLines = doc.splitTextToSize(store.address, contentWidth);
    doc.text(addressLines, widthMm / 2, y, { align: "center" });
    y += addressLines.length * 3.2;
  }
  if (store.phone) {
    doc.text(`WA/Telp: ${store.phone}`, widthMm / 2, y, { align: "center" });
    y += 3.5;
  }

  // Divider 1
  y += 1;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(mg, y, right, y);
  y += 3.5;

  // 2. Metadata (No Struk, Tanggal, Kasir)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`No: ${tx.receiptNumber}`, mg, y);
  doc.setFont("helvetica", "normal");
  doc.text(tx.cashierName || "Kasir", right, y, { align: "right" });
  y += 3.2;

  const dateStr = new Date(tx.timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(dateStr, mg, y);
  if (tx.customerName) {
    doc.text(`Pelanggan: ${tx.customerName}`, right, y, { align: "right" });
  }
  y += 3.5;

  // Divider 2
  doc.line(mg, y, right, y);
  y += 4;

  // 3. Item List
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  for (const item of tx.items || []) {
    const nameLabel = item.variant ? `${item.name} (${item.variant})` : item.name;
    const priceStr = `Rp ${formatRupiah(item.qty * item.price)}`;
    const maxNameWidth = contentWidth - doc.getTextWidth(priceStr) - 3;
    let displayName = nameLabel;
    while (displayName.length > 3 && doc.getTextWidth(displayName) > maxNameWidth) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName.length < nameLabel.length) {
      displayName = displayName.trimEnd() + "...";
    }

    doc.text(displayName, mg, y);
    doc.text(priceStr, right, y, { align: "right" });
    y += 3.2;

    // Sub-line: Qty x Unit Price
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(`  ${item.qty} x ${formatRupiah(item.price)}`, mg, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    y += 3.8;
  }

  // Divider 3
  y += 0.5;
  doc.line(mg, y, right, y);
  y += 3.8;

  // 4. Subtotal & Discount
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Subtotal", mg, y);
  doc.text(`Rp ${formatRupiah(tx.subtotal)}`, right, y, { align: "right" });
  y += 3.2;

  if (tx.discount > 0) {
    doc.text("Diskon", mg, y);
    doc.text(`-Rp ${formatRupiah(tx.discount)}`, right, y, { align: "right" });
    y += 3.2;
  }

  // Divider 4 (Thick line for Total)
  y += 0.5;
  doc.setLineWidth(0.4);
  doc.line(mg, y, right, y);
  doc.setLineWidth(0.2);
  y += 4.5;

  // 5. Total (Prominent)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", mg, y);
  doc.text(`Rp ${formatRupiah(tx.total)}`, right, y, { align: "right" });
  y += 4.2;

  // 6. Payment Detail
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const methodMap: Record<string, string> = {
    cash: "TUNAI",
    qris: "QRIS",
    transfer: "TRANSFER",
    split: "SPLIT",
    kasbon: "KASBON",
  };
  const methodLabel = methodMap[tx.paymentMethod] || tx.paymentMethod.toUpperCase();
  doc.text("Metode Pembayaran", mg, y);
  doc.setFont("helvetica", "bold");
  doc.text(methodLabel, right, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 3.2;

  if (tx.paymentMethod === "cash") {
    doc.text("Bayar Tunai", mg, y);
    doc.text(`Rp ${formatRupiah(tx.cashTendered)}`, right, y, { align: "right" });
    y += 3.2;
    doc.text("Kembalian", mg, y);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${formatRupiah(tx.cashChange)}`, right, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 3.2;
  } else if (tx.paymentMethod === "kasbon") {
    doc.text("Status Kasbon", mg, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(190, 20, 20);
    doc.text("BELUM LUNAS", right, y, { align: "right" });
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    y += 3.2;
  }

  // Divider 5
  y += 1;
  doc.line(mg, y, right, y);
  y += 4;

  // 7. Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(store.receiptFooter || "Matur nuwun sampun mampir!", widthMm / 2, y, { align: "center" });
  y += 3;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Simpan struk ini sebagai bukti pembayaran", widthMm / 2, y, { align: "center" });

  return doc;
}

export function printDirectThermal(tx: any, store: any, widthMm = 58) {
  const doc = generateThermalPdf(tx, store, widthMm);
  const blobUrl = String(doc.output("bloburl"));
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  };
}

export function shareViaWhatsApp(tx: any, store: any, targetPhone?: string) {
  const itemsText = (tx.items || [])
    .map((i: any) => `• ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.qty} = Rp ${formatRupiah(i.qty * i.price)}`)
    .join("\n");

  const msg = [
    `*🧾 STRUK PEMBELIAN — ${store.name || "WARUNG"}*`,
    `No: ${tx.receiptNumber}`,
    `Waktu: ${new Date(tx.timestamp).toLocaleString("id-ID")}`,
    `--------------------------------`,
    itemsText,
    `--------------------------------`,
    `*TOTAL: Rp ${formatRupiah(tx.total)}*`,
    `Metode: ${tx.paymentMethod.toUpperCase()}`,
    tx.paymentMethod === "cash" ? `Bayar: Rp ${formatRupiah(tx.cashTendered)} | Kembali: Rp ${formatRupiah(tx.cashChange)}` : "",
    `--------------------------------`,
    store.receiptFooter || "Terima kasih atas kunjungan Anda!",
  ].filter(Boolean).join("\n");

  const cleanPhone = (targetPhone || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");
}
