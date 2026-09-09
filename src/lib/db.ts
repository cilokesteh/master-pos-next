import Dexie, { type Table } from "dexie";
import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().default("Umum"),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().default(0),
  stock: z.number().int().default(0),
  barcode: z.string().optional(),
  unit: z.string().default("pcs"),
  variants: z.array(z.string()).default([]),
  trackStock: z.boolean().default(true),
  updatedAt: z.number(),
});

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().default(0),
  qty: z.number().positive(),
  unit: z.string().default("pcs"),
  note: z.string().optional(),
  variant: z.string().optional(),
  trackStock: z.boolean().default(true),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string().default(""),
  notes: z.string().optional(),
  totalDebt: z.number().nonnegative().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ExpenseSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  amount: z.number().positive(),
  source: z.enum(["laci", "owner"]).default("laci"),
  cashierName: z.string().default("Kasir"),
  shiftId: z.string().optional(),
  timestamp: z.number(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  receiptNumber: z.string(),
  items: z.array(CartItemSchema),
  units: z.number().positive(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  cost: z.number().nonnegative().default(0),
  grossProfit: z.number(),
  paymentMethod: z.enum(["cash", "qris", "transfer", "split", "kasbon"]),
  cashTendered: z.number().nonnegative().default(0),
  cashChange: z.number().nonnegative().default(0),
  splitCash: z.number().nonnegative().default(0),
  splitNonCash: z.number().nonnegative().default(0),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  debtBalance: z.number().nonnegative().default(0),
  debtStatus: z.enum(["none", "unpaid", "partial", "paid"]).default("none"),
  shiftId: z.string().optional(),
  cashierName: z.string().default("Kasir"),
  notes: z.string().optional(),
  timestamp: z.number(),
  synced: z.boolean().default(false),
});

export const DebtLedgerSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  transactionId: z.string(),
  type: z.enum(["new_debt", "repayment"]),
  amount: z.number().positive(),
  balanceAfter: z.number().nonnegative(),
  notes: z.string().optional(),
  timestamp: z.number(),
});

export const ShiftSchema = z.object({
  id: z.string(),
  cashierName: z.string().default("Kasir"),
  startTime: z.number(),
  endTime: z.number().optional(),
  openingCash: z.number().nonnegative().default(0),
  closingCashActual: z.number().nonnegative().optional(),
  cashSales: z.number().nonnegative().default(0),
  nonCashSales: z.number().nonnegative().default(0),
  debtIssued: z.number().nonnegative().default(0),
  debtCollected: z.number().nonnegative().default(0),
  expensesPaid: z.number().nonnegative().default(0),
  expectedCash: z.number().nonnegative().default(0),
  cashDifference: z.number().default(0),
  status: z.enum(["open", "closed"]).default("open"),
  notes: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type DebtLedger = z.infer<typeof DebtLedgerSchema>;
export type Shift = z.infer<typeof ShiftSchema>;

export type SyncOperation = {
  id: string;
  idempotencyKey: string;
  entityType: "transaction" | "product" | "customer" | "expense" | "debtLedger" | "shift";
  entityId: string;
  action: "upsert" | "delete";
  payload?: Record<string, unknown>;
  status: "pending" | "syncing" | "synced" | "failed";
  attempts: number;
  createdAt: number;
  updatedAt: number;
  nextRetryAt?: number;
  syncedAt?: number;
  error?: string;
};

export class PosDatabase extends Dexie {
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  customers!: Table<Customer, string>;
  expenses!: Table<Expense, string>;
  debtLedgers!: Table<DebtLedger, string>;
  shifts!: Table<Shift, string>;
  syncQueue!: Table<SyncOperation, string>;

  constructor() {
    super("master_pos_umkm_db");
    this.version(2).stores({
      products: "id, name, category, barcode, updatedAt",
      transactions: "id, receiptNumber, paymentMethod, customerId, shiftId, timestamp, synced",
      customers: "id, name, phone, totalDebt, updatedAt",
      expenses: "id, category, shiftId, timestamp",
      debtLedgers: "id, customerId, transactionId, type, timestamp",
      shifts: "id, status, startTime, endTime",
      syncQueue: "id, idempotencyKey, entityType, status, nextRetryAt",
    });
  }
}

export const db = new PosDatabase();
