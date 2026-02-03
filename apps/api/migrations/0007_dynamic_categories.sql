-- Migration: Add dynamic item categories
-- Created: 2026-02-01

-- 1. Add item_categories to settings with default values
ALTER TABLE settings ADD COLUMN item_categories TEXT DEFAULT '["snack","skincare","makeup","stationery","gift","beverage","accessories"]';

-- 2. Recreate items table to remove the CHECK constraint on category
CREATE TABLE items_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  photos TEXT NOT NULL,
  base_price_yen INTEGER NOT NULL,
  base_price_rp INTEGER NOT NULL DEFAULT 0,
  selling_price INTEGER NOT NULL,
  weight_grams INTEGER NOT NULL,
  without_box_note INTEGER NOT NULL DEFAULT 0,
  is_limited_edition INTEGER NOT NULL DEFAULT 0,
  is_preorder INTEGER NOT NULL DEFAULT 0,
  is_fragile INTEGER NOT NULL DEFAULT 0,
  category TEXT, -- Removed CHECK constraint
  info_notes TEXT DEFAULT '[]',
  max_orders INTEGER NOT NULL DEFAULT 10,
  current_orders INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_draft INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Copy data from old table to new table
INSERT INTO items_new (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, weight_grams,
  without_box_note, is_limited_edition, is_preorder, is_fragile, category, info_notes,
  max_orders, current_orders, is_available, is_draft, view_count, created_at, updated_at
)
SELECT 
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, weight_grams,
  without_box_note, is_limited_edition, is_preorder, is_fragile, category, info_notes,
  max_orders, current_orders, is_available, is_draft, view_count, created_at, updated_at
FROM items;

-- 4. Drop old table and rename new table
DROP TABLE items;
ALTER TABLE items_new RENAME TO items;

-- 5. Recreate indexes and triggers
CREATE INDEX idx_items_available ON items(is_available, is_draft) WHERE is_available = 1 AND is_draft = 0;
CREATE INDEX idx_items_search ON items(name, description);
CREATE INDEX idx_items_category ON items(category);

CREATE TRIGGER update_items_timestamp 
AFTER UPDATE ON items
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
