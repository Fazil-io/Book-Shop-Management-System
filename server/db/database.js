const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'store.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for optimal performance and relational integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'cashier')) NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    supplied_categories TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode_isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_brand TEXT,
    category TEXT CHECK(category IN ('Book', 'Stationery')) NOT NULL,
    sub_category TEXT,
    price REAL NOT NULL,
    cost_price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode_isbn);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT,
    reward_points INTEGER DEFAULT 0,
    total_purchases REAL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    cashier_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    subtotal REAL NOT NULL,
    tax_amount REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_mode TEXT CHECK(payment_mode IN ('Cash', 'Card', 'UPI')) NOT NULL,
    status TEXT DEFAULT 'Completed',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_title TEXT NOT NULL,
    barcode_isbn TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
`);

module.exports = {
  db,
  all: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  get: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  run: (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },
  exec: (sql) => db.exec(sql)
};
