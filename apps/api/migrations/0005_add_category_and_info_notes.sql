-- Migration: Add category and info_notes to items
-- Created: 2025-01-31

-- Add category column to items table
ALTER TABLE items ADD COLUMN category TEXT CHECK (category IN ('snack', 'skincare', 'makeup', 'stationery', 'gift', 'beverage', 'accessories'));

-- Add info_notes column as JSON (array of {type, text} objects)
ALTER TABLE items ADD COLUMN info_notes TEXT DEFAULT '[]';

-- Update index to include category for filtering
CREATE INDEX idx_items_category ON items(category);
