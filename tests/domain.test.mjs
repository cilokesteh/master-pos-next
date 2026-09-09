import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartTotals,
  calculateCashDrawer,
  calculateGrossProfit,
  calculateInstallment,
  roundCash,
  validateStock,
} from "../src/lib/domain.mjs";

const items = [
  { productId: "rice", name: "Nasi Goreng", qty: 2, price: 15000, cost: 9000 },
  { productId: "tea", name: "Es Teh", qty: 1, price: 5000, cost: 1500 },
];

test("cart total menghitung omzet, HPP, dan jumlah unit", () => {
  assert.deepEqual(calculateCartTotals(items, 2000), {
    units: 3,
    subtotal: 35000,
    discount: 2000,
    total: 33000,
    cost: 19500,
    grossProfit: 13500,
  });
});

test("stok tidak boleh menjadi negatif", () => {
  assert.equal(validateStock(2, 2), true);
  assert.equal(validateStock(2, 3), false);
});

test("pembulatan tunai naik ke pecahan 500", () => {
  assert.equal(roundCash(12101), 12500);
  assert.equal(roundCash(12500), 12500);
});

test("laba kotor mengurangi HPP dan diskon", () => {
  assert.equal(calculateGrossProfit(items, 2000), 13500);
});

test("kas seharusnya memisahkan pemasukan non-tunai dan kasbon", () => {
  const result = calculateCashDrawer({ openingCash: 100000, cashSales: 250000, debtPayments: 40000, expenses: 35000, cashRefunds: 10000 });
  assert.equal(result, 345000);
});

test("cicilan kasbon tidak boleh melebihi sisa piutang", () => {
  assert.deepEqual(calculateInstallment(50000, 20000), { paid: 20000, remaining: 30000, status: "partial" });
  assert.deepEqual(calculateInstallment(50000, 70000), { paid: 50000, remaining: 0, status: "paid" });
});
