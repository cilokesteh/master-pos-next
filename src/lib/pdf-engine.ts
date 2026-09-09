import { jsPDF } from "jspdf";
import { formatThermalReceipt } from "./thermal-receipt.mjs";

export function generateThermalPdf(tx: any, store: any, widthMm = 58): jsPDF {
  const { lines } = formatThermalReceipt(tx, store, widthMm);
  const lineHeight = 3.6;
  const marginTop = 5;
  const marginBottom = 6;
  const heightMm = Math.max(70, marginTop + lines.length * lineHeight + marginBottom);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);

  let y = marginTop;
  for (const line of lines) {
    doc.text(line, 2, y);
    y += lineHeight;
  }

  return doc;
}

export function printDirectThermal(tx: any, store: any, widthMm = 58) {
  const { lines } = formatThermalReceipt(tx, store, widthMm);
  const textContent = lines.join("\n");
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Print Struk</title>
        <style>
          @page { margin: 0; size: ${widthMm}mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.25;
            margin: 0;
            padding: 8px 4px;
            white-space: pre-wrap;
            color: #000;
            background: #fff;
          }
        </style>
      </head>
      <body><pre id="receipt-text"></pre></body>
    </html>
  `);
  const pre = win.document.getElementById("receipt-text");
  if (pre) pre.textContent = textContent;
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}

export function shareViaWhatsApp(tx: any, store: any, targetPhone?: string) {
  const { lines } = formatThermalReceipt(tx, store, 58);
  const text = encodeURIComponent(
    `*STRUK PEMBELIAN — ${store.name || "WARUNG"}*\n` +
      `\`\`\`\n${lines.join("\n")}\n\`\`\`\n` +
      `Terima kasih sudah berbelanja!`
  );
  const cleanPhone = (targetPhone || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}?text=${text}`
    : `https://wa.me/?text=${text}`;
  window.open(waUrl, "_blank");
}
