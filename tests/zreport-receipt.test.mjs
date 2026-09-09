import test from "node:test";
import assert from "node:assert/strict";
import { formatZReportReceipt } from "../src/lib/thermal-receipt.mjs";

const zData = {
  shiftId: "SHIFT-001",
  cashierName: "Budi",
  startTime: 1788912000000,
  endTime: 1788955200000,
  openingCash: 100000,
  cashSales: 350000,
  qrisSales: 120000,
  transferSales: 50000,
  kasbonSales: 40000,
  debtCollected: 30000,
  expenses: 35000,
  expectedCash: 445000,
  actualCash: 440000,
  difference: -5000,
  transactionsCount: 28,
};

const store = {
  name: "Warung Berkah",
  phone: "081234567890",
};

test("z-report receipt formats correctly for 58mm thermal", () => {
  const receipt = formatZReportReceipt(zData, store, 58);
  assert.ok(receipt.lines.length > 10);
  const text = receipt.lines.join("\n");
  assert.ok(text.includes("LAPORAN TUTUP KASIR (Z)"));
  assert.ok(text.includes("Modal Awal"));
  assert.ok(text.includes("350.000"));
  assert.ok(text.includes("Kas Seharusnya"));
  assert.ok(text.includes("Selisih"));
  for (const line of receipt.lines) {
    assert.ok(line.length <= 34, `Line too long: "${line}" (${line.length})`);
  }
});
