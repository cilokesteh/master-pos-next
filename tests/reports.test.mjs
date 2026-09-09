import test from "node:test";
import assert from "node:assert/strict";
import { aggregateSales, makeZReport, rankProducts, toCsv } from "../src/lib/reports.mjs";

const txs = [
  {
    id: "1", paymentMethod: "cash", total: 30000, units: 3, cost: 18000, grossProfit: 12000,
    items: [{ productId: "nasgor", name: "Nasi Goreng", qty: 2, price: 15000, cost: 9000 }],
  },
  {
    id: "2", paymentMethod: "qris", total: 5000, units: 1, cost: 1500, grossProfit: 3500,
    items: [{ productId: "tea", name: "Es Teh", qty: 1, price: 5000, cost: 1500 }],
  },
  {
    id: "3", paymentMethod: "split", total: 20000, splitCash: 8000, splitNonCash: 12000, units: 2, cost: 11000, grossProfit: 9000,
    items: [{ productId: "nasgor", name: "Nasi Goreng", qty: 1, price: 15000, cost: 9000 }, { productId: "tea", name: "Es Teh", qty: 1, price: 5000, cost: 2000 }],
  },
];

test("sales aggregation separates payment channels", () => {
  assert.deepEqual(aggregateSales(txs), {
    transactions: 3,
    units: 6,
    omzet: 55000,
    hpp: 30500,
    grossProfit: 24500,
    cash: 38000,
    qris: 17000,
    transfer: 0,
    split: 20000,
    kasbon: 0,
  });
});

test("z-report calculates expected drawer cash", () => {
  const report = makeZReport({
    shift: { openingCash: 100000, closingCashActual: 160000 },
    transactions: txs,
    expenses: [{ source: "laci", amount: 15000 }, { source: "owner", amount: 30000 }],
    debtPayments: 10000,
  });
  assert.equal(report.expectedCash, 133000);
  assert.equal(report.difference, 27000);
});

test("product ranking sums units and omzet", () => {
  const ranked = rankProducts(txs);
  assert.equal(ranked[0].name, "Nasi Goreng");
  assert.equal(ranked[0].qty, 3);
  assert.equal(ranked[0].omzet, 45000);
});

test("csv output escapes commas and quotes", () => {
  const csv = toCsv([{ name: 'Kopi, "Susu"', total: 10000 }], [{ key: "name", label: "Produk" }, { key: "total", label: "Total" }]);
  assert.ok(csv.includes('"Kopi, ""Susu"""'));
});
