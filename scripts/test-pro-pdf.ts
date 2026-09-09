import { generateThermalPdf } from "../src/lib/pdf-engine";
import { writeFileSync } from "node:fs";

const tx = {
  receiptNumber: "W-260909-1234",
  timestamp: 1788937200000,
  cashierName: "Budi Santoso",
  paymentMethod: "cash",
  cashTendered: 50000,
  cashChange: 17000,
  subtotal: 35000,
  discount: 2000,
  total: 33000,
  items: [
    { name: "Ayam Geprek + Nasi", qty: 2, price: 13000, variant: "Pedas Level 3" },
    { name: "Es Teh Manis", qty: 2, price: 3000, variant: "Manis" },
    { name: "Gorengan Bakwan", qty: 3, price: 1000 },
  ],
};

const store = {
  name: "Warung Berkah UMKM",
  address: "Jl. Mawar No. 12, Semarang Tengah",
  phone: "0812-3456-7890",
  receiptFooter: "Matur nuwun sampun mampir!",
};

const doc = generateThermalPdf(tx, store, 58);
const arrayBuffer = doc.output("arraybuffer");
writeFileSync("/tmp/pro_receipt_test.pdf", Buffer.from(arrayBuffer));
console.log("PRO_PDF_SAVED");
