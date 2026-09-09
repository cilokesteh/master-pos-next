"use client";

import { create } from "zustand";
import type { CartItem, Product } from "./db";

type CartState = {
  items: CartItem[];
  discount: number;
  add: (product: Product, variant?: string) => void;
  changeQty: (id: string, qty: number, stock: number) => void;
  setNote: (id: string, note: string) => void;
  remove: (id: string) => void;
  setDiscount: (value: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],
  discount: 0,
  add: (product, variant) => set((state) => {
    const id = `${product.id}:${variant || "default"}`;
    const found = state.items.find((item) => item.id === id);
    if (found) {
      if (product.trackStock && found.qty >= product.stock) return state;
      return { items: state.items.map((item) => item.id === id ? { ...item, qty: item.qty + 1 } : item) };
    }
    if (product.trackStock && product.stock < 1) return state;
    return { items: [...state.items, {
      id, productId: product.id, name: product.name, price: product.price,
      cost: product.cost, qty: 1, unit: product.unit, variant,
      trackStock: product.trackStock,
    }] };
  }),
  changeQty: (id, qty, stock) => set((state) => ({
    items: state.items.map((item) => item.id === id
      ? { ...item, qty: Math.max(1, Math.min(qty, item.trackStock ? stock : 999)) }
      : item),
  })),
  setNote: (id, note) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, note } : item) })),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
  clear: () => set({ items: [], discount: 0 }),
}));
