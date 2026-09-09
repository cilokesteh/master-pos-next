const safe = (v) => Math.max(0, Number(v) || 0);

export function filterByPeriod(rows, startTime, endTime) {
  return rows.filter((row) => row.timestamp >= startTime && row.timestamp <= endTime);
}

export function aggregateSales(transactions) {
  const result = {
    transactions: transactions.length,
    units: 0,
    omzet: 0,
    hpp: 0,
    grossProfit: 0,
    cash: 0,
    qris: 0,
    transfer: 0,
    split: 0,
    kasbon: 0,
  };

  for (const tx of transactions) {
    result.units += safe(tx.units);
    result.omzet += safe(tx.total);
    result.hpp += safe(tx.cost);
    result.grossProfit += Number(tx.grossProfit) || 0;
    if (tx.paymentMethod === "cash") result.cash += safe(tx.total);
    if (tx.paymentMethod === "qris") result.qris += safe(tx.total);
    if (tx.paymentMethod === "transfer") result.transfer += safe(tx.total);
    if (tx.paymentMethod === "kasbon") result.kasbon += safe(tx.total);
    if (tx.paymentMethod === "split") {
      result.cash += safe(tx.splitCash);
      result.split += safe(tx.total);
      result.qris += safe(tx.splitNonCash);
    }
  }

  return result;
}

export function rankProducts(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    for (const item of tx.items || []) {
      const current = map.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        qty: 0,
        omzet: 0,
        profit: 0,
      };
      current.qty += safe(item.qty);
      current.omzet += safe(item.qty) * safe(item.price);
      current.profit += safe(item.qty) * (safe(item.price) - safe(item.cost));
      map.set(item.productId, current);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty || b.omzet - a.omzet);
}

export function makeZReport({ shift, transactions, expenses, debtPayments = 0 }) {
  const sales = aggregateSales(transactions);
  const expenseTotal = expenses
    .filter((expense) => expense.source === "laci")
    .reduce((sum, expense) => sum + safe(expense.amount), 0);
  const expectedCash = safe(shift.openingCash) + sales.cash + safe(debtPayments) - expenseTotal;
  const actual = shift.closingCashActual == null ? null : safe(shift.closingCashActual);
  return {
    ...sales,
    openingCash: safe(shift.openingCash),
    expenses: expenseTotal,
    debtPayments: safe(debtPayments),
    expectedCash,
    actualCash: actual,
    difference: actual == null ? null : actual - expectedCash,
  };
}

export function toCsv(rows, fields) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [fields.map((f) => quote(f.label)).join(","), ...rows.map((row) => fields.map((f) => quote(row[f.key])).join(","))].join("\n");
}
