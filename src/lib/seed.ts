import { db, Product } from "./db";

export const DEFAULT_STORE = {
  name: "Warung Berkah UMKM",
  tagline: "Enak, Murah, Bersahabat",
  address: "Jl. Mawar No. 12, Semarang",
  phone: "081234567890",
  receiptFooter: "Matur nuwun sampun mampir!",
  paperWidth: 58, // 58mm default thermal
};

export const SEED_PRODUCTS: Omit<Product, "updatedAt">[] = [
  // F&B / Minuman
  { id: "es-teh", name: "Es Teh Manis", category: "Minuman", price: 3000, cost: 1000, stock: 100, trackStock: false, unit: "cup", variants: ["Manis", "Tawar", "Hangat"] },
  { id: "kopi-hitam", name: "Kopi Hitam Tubruk", category: "Minuman", price: 4000, cost: 1500, stock: 50, trackStock: false, unit: "cangkir", variants: ["Panas", "Es"] },
  { id: "kopi-susu", name: "Kopi Susu Gula Aren", category: "Minuman", price: 6000, cost: 2500, stock: 40, trackStock: false, unit: "cup", variants: ["Dingin", "Hangat"] },
  { id: "es-jeruk", name: "Es Jeruk Peras", category: "Minuman", price: 5000, cost: 2000, stock: 30, trackStock: false, unit: "cup", variants: ["Es", "Hangat"] },

  // F&B / Makanan
  { id: "geprek-ori", name: "Ayam Geprek + Nasi", category: "Makanan", price: 13000, cost: 8000, stock: 40, trackStock: true, unit: "porsi", variants: ["Level 1", "Level 3", "Level 5"] },
  { id: "nasgor-kampung", name: "Nasi Goreng Spesial", category: "Makanan", price: 15000, cost: 9000, stock: 25, trackStock: true, unit: "porsi", variants: ["Pedas", "Sedang"] },
  { id: "indomie-telur", name: "Indomie Rebus / Goreng Telur", category: "Makanan", price: 10000, cost: 5500, stock: 50, trackStock: true, unit: "mangkok", variants: ["Goreng", "Kuah Soto", "Kuah Bawang"] },
  { id: "gorengan", name: "Gorengan Bakwan / Tahu / Tempe", category: "Snack", price: 1000, cost: 500, stock: 150, trackStock: false, unit: "biji", variants: ["Tempe", "Tahu", "Bakwan"] },

  // Sembako & Kelontong
  { id: "beras-5kg", name: "Beras Rojolele 5kg", category: "Sembako", price: 72000, cost: 67000, stock: 15, barcode: "8991001", trackStock: true, unit: "sak", variants: [] },
  { id: "minyak-1l", name: "Minyak Goreng Kita 1 Liter", category: "Sembako", price: 16500, cost: 15000, stock: 24, barcode: "8992002", trackStock: true, unit: "pouch", variants: [] },
  { id: "telur-1kg", name: "Telur Ayam Negeri 1kg", category: "Sembako", price: 27000, cost: 24500, stock: 30, trackStock: true, unit: "kg", variants: [] },
  { id: "rokok-surya", name: "Gudang Garam Surya 16", category: "Rokok", price: 34000, cost: 31500, stock: 20, barcode: "8993003", trackStock: true, unit: "bungkus", variants: [] },
];

export async function initDatabaseDefaults() {
  const count = await db.products.count();
  if (count === 0) {
    const now = Date.now();
    await db.products.bulkAdd(
      SEED_PRODUCTS.map((p) => ({
        ...p,
        updatedAt: now,
      }))
    );
  }
}
