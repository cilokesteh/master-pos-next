import test from "node:test";
import assert from "node:assert/strict";
import { validateCheckoutInventory, debtBalanceAfter } from "../src/lib/checkout-domain.mjs";

test("checkout menolak produk hilang", () => {
  assert.throws(() => validateCheckoutInventory([{ productId: "x", qty: 1, trackStock: true }], new Map()), /tidak ditemukan/);
});

test("checkout menolak stok aktual kurang", () => {
  const products = new Map([["x", { id: "x", name: "Beras", stock: 1, trackStock: true }]]);
  assert.throws(() => validateCheckoutInventory([{ productId: "x", qty: 2, trackStock: true }], products), /Stok Beras tidak cukup/);
});

test("checkout menghasilkan stok baru tanpa negatif", () => {
  const products = new Map([["x", { id: "x", name: "Beras", stock: 3, trackStock: true }]]);
  assert.deepEqual(validateCheckoutInventory([{ productId: "x", qty: 2, trackStock: true }], products), [{ productId: "x", nextStock: 1 }]);
});

test("saldo ledger pelanggan baru sama dengan nilai kasbon, bukan dua kali", () => {
  assert.equal(debtBalanceAfter(0, 20000), 20000);
  assert.equal(debtBalanceAfter(15000, 20000), 35000);
});
