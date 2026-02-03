-- Seed test items for debugging info notes
-- These items demonstrate all combinations of info flags

-- Clear existing test items (optional - uncomment if needed)
-- DELETE FROM items WHERE name LIKE 'TEST:%';

-- Test Item 1: All flags enabled
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-all-flags',
  'TEST: All Flags Enabled',
  'This item has withoutBox, Limited Edition, Preorder, and Fragile all set to true. Should show 4 info notes.',
  '["item-1.jpg"]',
  1000, 108500, 150000,
  250, 1, 1, 1, 1,
  'snack', '[{"type": "amber", "text": "Custom: Best seller item!"}]',
  10, 0, 1, 0, 150
);

-- Test Item 2: Only Without Box
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-no-box-only',
  'TEST: Tanpa Box Only',
  'This item only has withoutBoxNote=true. Should show amber info note with box message.',
  '["item-2.jpg"]',
  500, 54250, 75000,
  100, 1, 0, 0, 0,
  'skincare', '[]',
  10, 0, 1, 0, 50
);

-- Test Item 3: Only Limited Edition
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-limited-only',
  'TEST: Limited Edition Only',
  'This item only has isLimitedEdition=true. Should show purple info note.',
  '["item-3.jpg"]',
  2000, 217000, 300000,
  300, 0, 1, 0, 0,
  'gift', '[]',
  5, 3, 1, 0, 200
);

-- Test Item 4: Only Preorder
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-preorder-only',
  'TEST: Preorder Only',
  'This item only has isPreorder=true. Should show blue info note.',
  '["item-4.jpg"]',
  1500, 162750, 220000,
  400, 0, 0, 1, 0,
  'stationery', '[]',
  20, 0, 1, 0, 30
);

-- Test Item 5: Only Fragile
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-fragile-only',
  'TEST: Fragile Only',
  'This item only has isFragile=true. Should show red info note.',
  '["item-5.jpg"]',
  3000, 325500, 450000,
  150, 0, 0, 0, 1,
  'gift', '[]',
  8, 2, 1, 0, 80
);

-- Test Item 6: No flags + Custom infoNotes only
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-custom-only',
  'TEST: Custom Info Notes Only',
  'This item has no boolean flags but has custom infoNotes from backend. Should show custom notes.',
  '["item-6.jpg"]',
  800, 86800, 120000,
  200, 0, 0, 0, 0,
  'beverage', '[{"type": "amber", "text": "Limited stock - Hurry up!"}, {"type": "blue", "text": "Free gift wrapping available"}]',
  15, 0, 1, 0, 45
);

-- Test Item 7: Mix flags + Custom infoNotes
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-mix-custom',
  'TEST: Mix Flags + Custom Notes',
  'This item has withoutBox=true, isFragile=true, and custom info notes. Should merge without duplicates.',
  '["item-7.jpg"]',
  2500, 271250, 380000,
  500, 1, 0, 0, 1,
  'accessories', '[{"type": "purple", "text": "Exclusive design"}]',
  12, 5, 1, 0, 120
);

-- Test Item 8: No info at all
INSERT INTO items (
  id, name, description, photos, base_price_yen, base_price_rp, selling_price, 
  weight_grams, without_box_note, is_limited_edition, is_preorder, is_fragile, 
  category, info_notes, max_orders, current_orders, is_available, is_draft, view_count
) VALUES (
  'test-no-info',
  'TEST: No Info Notes',
  'This item has no flags and no custom infoNotes. Informasi Penting section should be hidden.',
  '["item-8.jpg"]',
  600, 65100, 90000,
  120, 0, 0, 0, 0,
  'snack', '[]',
  25, 0, 1, 0, 10
);

SELECT '8 test items inserted successfully' as result;
