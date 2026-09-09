import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, validateBackupPayload, allocateDebtRepayment } from "../src/lib/security-and-hardening.mjs";

test("escapeHtml menetralkan tag XSS untuk print dan UI", () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  assert.equal(escapeHtml("Ayam & Bebek"), "Ayam &amp; Bebek");
});

test("validateBackupPayload menolak data tanpa struktur atau bernilai negatif", () => {
  assert.throws(() => validateBackupPayload(null), /tidak valid/);
  assert.throws(() => validateBackupPayload({ version: 1, data: { products: [{ id: "1", name: "A", price: -100 }] } }), /tidak valid/);
});

test("allocateDebtRepayment melunasi invoice tertua lebih dulu (FIFO)", () => {
  const invoices = [
    { id: "tx1", debtBalance: 20000, debtStatus: "unpaid" },
    { id: "tx2", debtBalance: 30000, debtStatus: "unpaid" },
  ];
  const { updatedInvoices, remainingPayment } = allocateDebtRepayment(invoices, 25000);
  assert.equal(remainingPayment, 0);
  assert.equal(updatedInvoices[0].debtBalance, 0);
  assert.equal(updatedInvoices[0].debtStatus, "paid");
  assert.equal(updatedInvoices[1].debtBalance, 25000);
  assert.equal(updatedInvoices[1].debtStatus, "partial");
});
