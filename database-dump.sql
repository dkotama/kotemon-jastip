PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial.sql','2026-01-31 14:24:01');
INSERT INTO "d1_migrations" VALUES(2,'0002_add_view_count.sql','2026-01-31 15:32:13');
INSERT INTO "d1_migrations" VALUES(3,'0003_add_users_and_tokens.sql','2026-01-31 15:45:39');
INSERT INTO "d1_migrations" VALUES(4,'0004_add_user_revocation.sql','2026-01-31 18:24:20');
INSERT INTO "d1_migrations" VALUES(5,'0005_add_category_and_info_notes.sql','2026-02-01 09:22:57');
INSERT INTO "d1_migrations" VALUES(6,'0006_add_base_price_rp.sql','2026-02-01 09:22:58');
INSERT INTO "d1_migrations" VALUES(7,'0007_dynamic_categories.sql','2026-02-01 09:22:58');
INSERT INTO "d1_migrations" VALUES(8,'0008_add_orders.sql','2026-02-01 10:10:51');
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
, item_categories TEXT DEFAULT '["snack","skincare","makeup","stationery","gift","beverage","accessories"]');
INSERT INTO "settings" VALUES('default',108.5,30,20000,'open','2026-02-28','15-20 Mar 2026','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','2026-02-01 10:42:12','["snack","skincare","makeup","stationery","gift","beverage","accessories"]');
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  token_id TEXT REFERENCES tokens(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, is_revoked INTEGER DEFAULT 0, revoked_at TEXT, revoked_by TEXT);
INSERT INTO "users" VALUES('d308a733-924d-4ead-984f-a025fa459cfa','109498575780613835302','p9363bg2@s.okayama-u.ac.jp','NYOMAN DARMA KOTAMA I','https://lh3.googleusercontent.com/a/ACg8ocLiexD1wuzSLFvHjMUySyJ1LK2yhCNcplYxoaKtaEf93PV4TQ=s96-c','801acf5f-34ad-4467-84e5-779da83c3483','2026-02-01T09:11:22.882Z','2026-02-01T09:11:22.882Z',0,NULL,NULL);
INSERT INTO "users" VALUES('c62a62f2-e7d0-40e5-8faa-239dc9654f4e','110157325787298049685','darma.kotama@gmail.com','Darma Kotama','https://lh3.googleusercontent.com/a/ACg8ocIBQUfWq4obStNI6ytuNLj-9-dM_3xqHYKne0x4GchgAw1CZpwZGw=s96-c','ddec2132-bc8c-4388-b824-79e3dea077f3','2026-02-01T09:25:51.018Z','2026-02-01T09:25:51.018Z',0,NULL,NULL);
CREATE TABLE tokens (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  used_by TEXT REFERENCES users(id),
  used_at TEXT,
  expires_at TEXT,
  is_revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "tokens" VALUES('token-001','KOTEMON2025','system',NULL,NULL,NULL,0,'2026-01-31 15:47:37');
INSERT INTO "tokens" VALUES('token-002','VALID123','system',NULL,NULL,NULL,0,'2026-01-31 15:47:54');
INSERT INTO "tokens" VALUES('token-003','REVOKED123','system',NULL,NULL,NULL,1,'2026-01-31 15:47:55');
INSERT INTO "tokens" VALUES('token-004','EXPIRED123','system',NULL,NULL,'2020-01-01T00:00:00Z',0,'2026-01-31 15:47:56');
INSERT INTO "tokens" VALUES('token-005','FRESH123','system',NULL,NULL,NULL,0,'2026-01-31 15:48:05');
INSERT INTO "tokens" VALUES('token-test','TESTCODE','system',NULL,NULL,NULL,1,'2026-01-31 15:48:36');
INSERT INTO "tokens" VALUES('e4ea8c44-8f62-4b02-835c-1f298abc8463','KOTEMON-2026-BG3O26','admin',NULL,NULL,NULL,1,'2026-01-31T18:15:39.290Z');
INSERT INTO "tokens" VALUES('ddec2132-bc8c-4388-b824-79e3dea077f3','22325','admin','c62a62f2-e7d0-40e5-8faa-239dc9654f4e','2026-02-01T09:25:51.037Z',NULL,0,'2026-01-31T18:26:36.900Z');
INSERT INTO "tokens" VALUES('801acf5f-34ad-4467-84e5-779da83c3483','59991','admin','d308a733-924d-4ead-984f-a025fa459cfa','2026-02-01T09:11:22.888Z',NULL,0,'2026-02-01T09:10:49.474Z');
CREATE TABLE IF NOT EXISTS "items" (
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
  category TEXT, 
  info_notes TEXT DEFAULT '[]',
  max_orders INTEGER NOT NULL DEFAULT 10,
  current_orders INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_draft INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "items" VALUES('71514128-56ad-4b24-a8c3-095c8fa7d326','Test Anime Figure','A test figure for view counter testing','["https://example.com/test.jpg"]',5000,542500,750000,300,0,0,0,0,'stationery','[]',5,0,0,0,11,'2026-01-31 15:32:40','2026-02-01 07:38:23');
INSERT INTO "items" VALUES('ab21a6f3-8fe2-431d-aee1-137b8ee7ccd2','Updated Item','Inventore sed est ex','["/api/public/photos/uploads/e03419db-83b6-4a87-bc43-8d70c99f463e.png"]',800,86800,150000,100,1,0,0,0,'snack','[]',14,0,1,0,24,'2026-01-31 18:31:50','2026-02-01 09:26:29');
INSERT INTO "items" VALUES('test-all-flags','TEST: All Flags Enabled','This item has withoutBox, Limited Edition, Preorder, and Fragile all set to true. Should show 4 info notes.','["http://localhost:5173/images/item-1.jpg"]',1000,108500,150000,250,1,1,1,1,'snack','[{"type": "amber", "text": "Custom: Best seller item!"}]',10,0,1,0,152,'2026-02-01 09:30:51','2026-02-01 14:18:06');
INSERT INTO "items" VALUES('test-no-box-only','TEST: Tanpa Box Only','This item only has withoutBoxNote=true. Should show amber info note with box message.','["http://localhost:5173/images/item-2.jpg"]',500,54250,75000,100,1,0,0,0,'skincare','[]',10,0,1,0,51,'2026-02-01 09:30:51','2026-02-01 09:52:51');
INSERT INTO "items" VALUES('test-limited-only','TEST: Limited Edition Only','This item only has isLimitedEdition=true. Should show purple info note.','["http://localhost:5173/images/item-3.jpg"]',2000,217000,300000,300,0,1,0,0,'gift','[]',5,3,1,0,202,'2026-02-01 09:30:51','2026-02-02 05:13:39');
INSERT INTO "items" VALUES('test-preorder-only','TEST: Preorder Only','This item only has isPreorder=true. Should show blue info note.','["http://localhost:5173/images/item-4.jpg"]',1500,162750,220000,400,0,0,1,0,'stationery','[]',20,0,1,0,32,'2026-02-01 09:30:51','2026-02-01 09:57:35');
INSERT INTO "items" VALUES('test-fragile-only','TEST: Fragile Only','This item only has isFragile=true. Should show red info note.','["http://localhost:5173/images/item-5.jpg"]',3000,325500,450000,150,0,0,0,1,'gift','[]',8,2,1,0,82,'2026-02-01 09:30:51','2026-02-01 09:57:38');
INSERT INTO "items" VALUES('test-custom-only','TEST: Custom Info Notes Only','This item has no boolean flags but has custom infoNotes from backend. Should show custom notes.','["http://localhost:5173/images/item-6.jpg"]',800,86800,120000,200,0,0,0,0,'beverage','[{"type": "amber", "text": "Limited stock - Hurry up!"}, {"type": "blue", "text": "Free gift wrapping available"}]',15,0,1,0,47,'2026-02-01 09:30:51','2026-02-01 10:11:24');
INSERT INTO "items" VALUES('test-mix-custom','TEST: Mix Flags + Custom Notes','This item has withoutBox=true, isFragile=true, and custom info notes. Should merge without duplicates.','["http://localhost:5173/images/item-7.jpg"]',2500,271250,380000,500,1,0,0,1,'accessories','[{"type": "purple", "text": "Exclusive design"}]',12,5,1,0,122,'2026-02-01 09:30:51','2026-02-02 04:48:48');
INSERT INTO "items" VALUES('test-no-info','TEST: No Info Notes','This item has no flags and no custom infoNotes. Informasi Penting section should be hidden.','["http://localhost:5173/images/item-8.jpg"]',600,65100,90000,120,0,0,0,0,'snack','[]',25,0,1,0,11,'2026-02-01 09:30:51','2026-02-01 09:53:20');
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'confirmed', 
  total_price_yen INTEGER NOT NULL DEFAULT 0,
  total_price_rp INTEGER NOT NULL DEFAULT 0,
  total_weight_grams INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  item_id TEXT REFERENCES items(id), 
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_yen INTEGER NOT NULL DEFAULT 0, 
  price_rp INTEGER NOT NULL DEFAULT 0, 
  weight_grams INTEGER NOT NULL DEFAULT 0,
  is_custom INTEGER NOT NULL DEFAULT 0,
  custom_url TEXT,
  custom_note TEXT,
  custom_source TEXT, 
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',8);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tokens_code ON tokens(code);
CREATE INDEX idx_users_revoked ON users(is_revoked);
CREATE INDEX idx_items_available ON items(is_available, is_draft) WHERE is_available = 1 AND is_draft = 0;
CREATE INDEX idx_items_search ON items(name, description);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE TRIGGER update_settings_timestamp 
AFTER UPDATE ON settings
BEGIN
  UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_items_timestamp 
AFTER UPDATE ON items
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_orders_timestamp 
AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;