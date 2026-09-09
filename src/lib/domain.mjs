const money = (value) => Math.max(0, Math.round(Number(value) || 0));

export function calculateCartTotals(items, discount = 0) {
  const units = items.reduce((sum, item) => sum + money(item.qty), 0);
  const subtotal = items.reduce((sum, item) => sum + money(item.qty) * money(item.price), 0);
  const cost = items.reduce((sum, item) => sum + money(item.qty) * money(item.cost), 0);
  const safeDiscount = Math.min(subtotal, money(discount));
  const total = subtotal - safeDiscount;
  return { units, subtotal, discount: safeDiscount, total, cost, grossProfit: total - cost };
}

export function validateStock(stock, requestedQty) {
  return money(requestedQty) > 0 && money(requestedQty) <= money(stock);
}

export function roundCash(total, denomination = 500) {
  return Math.ceil(money(total) / denomination) * denomination;
}

export function calculateGrossProfit(items, discount = 0) {
  return calculateCartTotals(items, discount).grossProfit;
}

export function calculateCashDrawer({ openingCash, cashSales, debtPayments, expenses, cashRefunds }) {
  return money(openingCash) + money(cashSales) + money(debtPayments) - money(expenses) - money(cashRefunds);
}

export function calculateInstallment(balance, payment) {
  const safeBalance = money(balance);
  const paid = Math.min(safeBalance, money(payment));
  const remaining = safeBalance - paid;
  return { paid, remaining, status: remaining === 0 ? "paid" : "partial" };
}
