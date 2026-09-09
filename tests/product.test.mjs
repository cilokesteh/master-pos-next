import test from "node:test";
import assert from "node:assert/strict";
import { calculateMargin, normalizeVariants, stockStatus } from "../src/lib/product-domain.mjs";

test("margin produk menghitung nominal dan persentase", () => {
  assert.deepEqual(calculateMargin(10000, 15000), { amount: 5000, percent: 33.33 });
});

test("varian dinormalisasi dan duplikat dibuang", () => {
  assert.deepEqual(normalizeVariants(" Pedas, Sedang, pedas, Tidak Pedas "), ["Pedas", "Sedang", "Tidak Pedas"]);
});

test("status stok membedakan habis, menipis, aman, dan non-tracked", () => {
  assert.equal(stockStatus(0, 5, true), "out");
  assert.equal(stockStatus(4, 5, true), "low");
  assert.equal(stockStatus(10, 5, true), "ok");
  assert.equal(stockStatus(0, 5, false), "unlimited");
});
