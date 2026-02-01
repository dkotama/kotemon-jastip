-- Migration: Add base_price_rp column to items table
-- Created: 2025-01-31
-- Description: Add calculated base price in IDR based on exchange rate

-- Add base_price_rp column to items table
ALTER TABLE items ADD COLUMN base_price_rp INTEGER NOT NULL DEFAULT 0;

-- Update existing items to calculate base_price_rp from base_price_yen
-- This requires joining with settings to get the exchange rate
-- Note: Run this update after deploying the new code that populates base_price_rp

-- Create index for potential price-based queries
CREATE INDEX idx_items_base_price_rp ON items(base_price_rp);
