import { db, type SyncOperation } from "./db";
import { enqueueUnique, markSynced, nextRetryDelay } from "./sync-domain.mjs";
import { validateBackupPayload } from "./security-and-hardening.mjs";

export async function queueSyncOperation(operation: Omit<SyncOperation, "id" | "status" | "attempts" | "createdAt" | "updatedAt">) {
  const existing = await db.syncQueue.where("idempotencyKey").equals(operation.idempotencyKey).first();
  if (existing) return existing;

  const now = Date.now();
  const record: SyncOperation = {
    id: crypto.randomUUID(),
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...operation,
  };
  await db.syncQueue.add(record);
  return record;
}

export async function getSyncStats() {
  const all = await db.syncQueue.toArray();
  const pending = all.filter((item) => item.status === "pending" || item.status === "failed").length;
  const synced = all.filter((item) => item.status === "synced").length;
  return { total: all.length, pending, synced };
}

export async function exportLocalBackup() {
  const [products, transactions, customers, expenses, debtLedgers, shifts] = await Promise.all([
    db.products.toArray(),
    db.transactions.toArray(),
    db.customers.toArray(),
    db.expenses.toArray(),
    db.debtLedgers.toArray(),
    db.shifts.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: Date.now(),
    data: { products, transactions, customers, expenses, debtLedgers, shifts },
  };
}

export async function importLocalBackup(payload: any) {
  validateBackupPayload(payload);
  const { products, transactions, customers, expenses, debtLedgers, shifts } = payload.data;

  await db.transaction("rw", [db.products, db.transactions, db.customers, db.expenses, db.debtLedgers, db.shifts], async () => {
    if (products?.length) await db.products.bulkPut(products);
    if (transactions?.length) await db.transactions.bulkPut(transactions);
    if (customers?.length) await db.customers.bulkPut(customers);
    if (expenses?.length) await db.expenses.bulkPut(expenses);
    if (debtLedgers?.length) await db.debtLedgers.bulkPut(debtLedgers);
    if (shifts?.length) await db.shifts.bulkPut(shifts);
  });
}
