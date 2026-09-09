export function validateCheckoutInventory(items, productsById) {
  const mutations = [];
  for (const item of items) {
    if (!item.trackStock) continue;
    const product = productsById.get(item.productId);
    if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan`);
    if (!Number.isFinite(item.qty) || item.qty <= 0) throw new Error(`Jumlah ${product.name} tidak valid`);
    if (product.stock < item.qty) throw new Error(`Stok ${product.name} tidak cukup (tersisa ${product.stock})`);
    mutations.push({ productId: product.id, nextStock: product.stock - item.qty });
  }
  return mutations;
}

export function debtBalanceAfter(currentBalance, newDebt) {
  return Math.max(0, Number(currentBalance) || 0) + Math.max(0, Number(newDebt) || 0);
}
