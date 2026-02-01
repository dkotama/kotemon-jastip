-- Migration: Initial Schema
-- Created: 2025-01-31

-- Settings table (single row configuration)
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  exchange_rate REAL NOT NULL DEFAULT 108.5,
  default_margin_percent INTEGER NOT NULL DEFAULT 30,
  total_baggage_quota_grams INTEGER NOT NULL DEFAULT 20000,
  jastip_status TEXT NOT NULL DEFAULT 'closed' CHECK (jastip_status IN ('open', 'closed')),
  jastip_close_date TEXT,
  estimated_arrival_date TEXT,
  admin_password_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings with bcrypt hash for 'kotemon123'
-- Hash generated with bcrypt (10 rounds): $2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INSERT INTO settings (admin_password_hash) VALUES ('$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Items table
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  photos TEXT NOT NULL, -- JSON array of URLs
  base_price_yen INTEGER NOT NULL,
  selling_price INTEGER NOT NULL,
  weight_grams INTEGER NOT NULL,
  without_box_note INTEGER NOT NULL DEFAULT 0,
  is_limited_edition INTEGER NOT NULL DEFAULT 0,
  is_preorder INTEGER NOT NULL DEFAULT 0,
  is_fragile INTEGER NOT NULL DEFAULT 0,
  max_orders INTEGER NOT NULL DEFAULT 10,
  current_orders INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_draft INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_items_available ON items(is_available, is_draft) WHERE is_available = 1 AND is_draft = 0;
CREATE INDEX idx_items_search ON items(name, description);

-- Trigger for updating updated_at timestamp on items
CREATE TRIGGER update_items_timestamp 
AFTER UPDATE ON items
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for updating updated_at timestamp on settings
CREATE TRIGGER update_settings_timestamp 
AFTER UPDATE ON settings
BEGIN
  UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
