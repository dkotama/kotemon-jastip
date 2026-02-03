-- Fix photo paths for test items to use absolute URLs
-- This assumes the frontend is running on localhost:5173

UPDATE items SET photos = '["http://localhost:5173/images/item-1.jpg"]' WHERE id = 'test-all-flags';
UPDATE items SET photos = '["http://localhost:5173/images/item-2.jpg"]' WHERE id = 'test-no-box-only';
UPDATE items SET photos = '["http://localhost:5173/images/item-3.jpg"]' WHERE id = 'test-limited-only';
UPDATE items SET photos = '["http://localhost:5173/images/item-4.jpg"]' WHERE id = 'test-preorder-only';
UPDATE items SET photos = '["http://localhost:5173/images/item-5.jpg"]' WHERE id = 'test-fragile-only';
UPDATE items SET photos = '["http://localhost:5173/images/item-6.jpg"]' WHERE id = 'test-custom-only';
UPDATE items SET photos = '["http://localhost:5173/images/item-7.jpg"]' WHERE id = 'test-mix-custom';
UPDATE items SET photos = '["http://localhost:5173/images/item-8.jpg"]' WHERE id = 'test-no-info';

SELECT 'Test item photo paths updated' as result;
