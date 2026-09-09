const money = (v) => Math.max(0, Number(v) || 0);

export function calculateMargin(cost, price) {
  const safeCost = money(cost);
  const safePrice = money(price);
  const amount = safePrice - safeCost;
  const percent = safePrice === 0 ? 0 : Math.round((amount / safePrice) * 10000) / 100;
  return { amount, percent };
}

export function normalizeVariants(input) {
  const seen = new Set();
  const result = [];
  for (const raw of String(input || "").split(",")) {
    const value = raw.trim();
    const key = value.toLocaleLowerCase("id-ID");
    if (value && !seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

export function stockStatus(stock, minimumStock = 5, trackStock = true) {
  if (!trackStock) return "unlimited";
  if (money(stock) === 0) return "out";
  if (money(stock) <= money(minimumStock)) return "low";
  return "ok";
}
