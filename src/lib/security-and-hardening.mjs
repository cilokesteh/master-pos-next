export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.data) {
    throw new Error("Payload backup tidak valid");
  }
  const { products, transactions, customers, expenses, debtLedgers, shifts } = payload.data;
  const validateNonNegativeNumbers = (list, keys) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      for (const k of keys) {
        if (typeof item[k] === "number" && item[k] < 0) {
          throw new Error(`Data tidak valid: ${k} negatif`);
        }
      }
    }
  };

  validateNonNegativeNumbers(products, ["price", "cost", "stock"]);
  validateNonNegativeNumbers(transactions, ["total", "subtotal", "cost"]);
  validateNonNegativeNumbers(customers, ["totalDebt"]);
  validateNonNegativeNumbers(expenses, ["amount"]);
  validateNonNegativeNumbers(debtLedgers, ["amount", "balanceAfter"]);
  validateNonNegativeNumbers(shifts, ["openingCash", "cashSales"]);
  return true;
}

export function allocateDebtRepayment(invoices, paymentAmount) {
  let remaining = Math.max(0, Number(paymentAmount) || 0);
  const updatedInvoices = [];

  for (const inv of invoices) {
    if (remaining <= 0 || (inv.debtBalance || 0) <= 0) {
      updatedInvoices.push({ ...inv });
      continue;
    }
    const current = inv.debtBalance || 0;
    const paid = Math.min(current, remaining);
    const balance = current - paid;
    remaining -= paid;
    updatedInvoices.push({
      ...inv,
      debtBalance: balance,
      debtStatus: balance === 0 ? "paid" : "partial",
    });
  }

  return { updatedInvoices, remainingPayment: remaining };
}
