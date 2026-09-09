import { jsPDF } from "jspdf";
import { formatZReportReceipt } from "./thermal-receipt.mjs";

export function generateZReportPdf(zData: any, store: any, widthMm = 58): jsPDF {
  const { lines } = formatZReportReceipt(zData, store, widthMm);
  const lineHeight = 3.6;
  const marginTop = 5;
  const marginBottom = 6;
  const heightMm = Math.max(80, marginTop + lines.length * lineHeight + marginBottom);

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

export function printDirectZReport(zData: any, store: any, widthMm = 58) {
  const { lines } = formatZReportReceipt(zData, store, widthMm);
  const textContent = lines.join("\n");
  const win = window.open("", "_blank", "width=380,height=650");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Z-Report Shift</title>
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
      <body><pre id="zreport-text"></pre></body>
    </html>
  `);
  const pre = win.document.getElementById("zreport-text");
  if (pre) pre.textContent = textContent;
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}
