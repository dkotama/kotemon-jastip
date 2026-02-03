-- Migration: Add orders and order_items tables
-- Created: 2026-02-01

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'waiting_payment' CHECK (status IN ('confirmed', 'waiting_payment', 'purchased', 'shipped', 'delivered', 'cancelled')),
  total_price_yen INTEGER NOT NULL DEFAULT 0,
  total_price_rp INTEGER NOT NULL DEFAULT 0,
  total_weight_grams INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id), -- Nullable for custom items
  name TEXT NOT NULL, -- Snapshot of item name or custom name
  quantity INTEGER NOT NULL DEFAULT 1,
  price_yen INTEGER NOT NULL DEFAULT 0, -- Snapshot per unit
  price_rp INTEGER NOT NULL DEFAULT 0, -- Snapshot per unit
  weight_grams INTEGER NOT NULL DEFAULT 0, -- Snapshot per unit
  
  -- Custom Item Fields
  is_custom INTEGER NOT NULL DEFAULT 0, -- Boolean 0/1
  custom_url TEXT,
  custom_note TEXT,
  custom_source TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
