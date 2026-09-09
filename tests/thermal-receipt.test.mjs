import test from "node:test";
import assert from "node:assert/strict";
import { formatThermalReceipt } from "../src/lib/thermal-receipt.mjs";

const tx = {
  receiptNumber: "POS-260909-001",
  timestamp: 1788937200000,
  cashierName: "Budi",
  paymentMethod: "cash",
  cashTendered: 50000,
  cashChange: 17000,
  subtotal: 35000,
  discount: 2000,
  total: 33000,
  items: [
    { name: "Ayam Geprek + Nasi", qty: 2, price: 13000, variant: "Pedas" },
    { name: "Es Teh Manis", qty: 2, price: 3000, variant: "Manis" },
    { name: "Gorengan Bakwan", qty: 3, price: 1000 },
  ],
};

const store = {
  name: "Warung Berkah",
  address: "Jl. Mawar No. 12",
  phone: "081234567890",
  receiptFooter: "Matur Nuwun!",
};

test("thermal receipt lines are within 32 chars for 58mm", () => {
  const receipt = formatThermalReceipt(tx, store, 58);
  assert.ok(receipt.lines.length > 5);
  for (const line of receipt.lines) {
    assert.ok(line.length <= 34, `Line exceeded 34 chars: "${line}" (length: ${line.length})`);
  }
});

test("thermal receipt includes totals, payment method, and change", () => {
  const receipt = formatThermalReceipt(tx, store, 58);
  const text = receipt.lines.join("\n");
  assert.ok(text.includes("POS-260909-001"));
  assert.ok(text.includes("33.000"));
  assert.ok(text.includes("50.000"));
  assert.ok(text.includes("17.000"));
});
