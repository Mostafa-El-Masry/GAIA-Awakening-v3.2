-- GAIA v2.1 Week 4 - D1 Schema Initialization

-- users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

-- settings (cloud-backed per user, non-sensitive plaintext JSON)
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,                -- plaintext JSON string (non-sensitive)
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- learning_progress (prep for later move)
CREATE TABLE IF NOT EXISTS learning_progress (
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  percent INTEGER DEFAULT 0,
  last_touched INTEGER,
  PRIMARY KEY (user_id, topic),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- academy_results
CREATE TABLE IF NOT EXISTS academy_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percent INTEGER NOT NULL,
  wrong_tags TEXT,          -- JSON array
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- labs
CREATE TABLE IF NOT EXISTS labs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  tags TEXT,                -- JSON array
  prompt TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- HEALTH TABLES (sensitive data at rest - encrypted before storage)

-- health_conditions
CREATE TABLE IF NOT EXISTS health_conditions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,       -- ENC (client-side encrypted)
  notes TEXT,               -- ENC (client-side encrypted)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- health_meds
CREATE TABLE IF NOT EXISTS health_meds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,       -- ENC (client-side encrypted)
  dose TEXT,                -- ENC (e.g., "500 mg", client-side encrypted)
  unit TEXT,                -- ENC or plaintext (mg, ml, etc.)
  schedule TEXT,            -- ENC (JSON: times per day, days of week)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- health_metrics
CREATE TABLE IF NOT EXISTS health_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date INTEGER NOT NULL,    -- epoch day or ms
  weight REAL,              -- plaintext (not highly sensitive)
  bg_fasting REAL,          -- plaintext or can be encrypted if stricter policy needed
  bg_post REAL,             -- plaintext or can be encrypted
  notes TEXT,               -- ENC (client-side encrypted)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- INVENTORY TABLES (product, location, and POS system management)

-- inventory_locations (8 physical warehouse/retail locations)
CREATE TABLE IF NOT EXISTS inventory_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,       -- Location name (e.g., "Main Warehouse", "Store #1")
  code TEXT NOT NULL,       -- Unique location code (e.g., "LOC001")
  address TEXT,             -- Physical address
  city TEXT,
  state TEXT,
  zip TEXT,
  location_type TEXT,       -- "warehouse", "retail", "storage"
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (user_id, code)
);

-- inventory_products (catalog of products sold)
CREATE TABLE IF NOT EXISTS inventory_products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sku TEXT NOT NULL,        -- Stock Keeping Unit (unique code)
  name TEXT NOT NULL,       -- Product name
  description TEXT,         -- Product description
  unit_cost REAL NOT NULL,  -- Cost to acquire/produce
  unit_price REAL NOT NULL, -- Retail/sale price
  category TEXT,            -- Product category for organization
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (user_id, sku)
);

-- inventory_stock (quantity tracking by location)
CREATE TABLE IF NOT EXISTS inventory_stock (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 0, -- Current stock level
  reserved INTEGER DEFAULT 0, -- Reserved for pending orders
  available INTEGER DEFAULT 0, -- available = quantity - reserved
  reorder_point INTEGER DEFAULT 10, -- Alert when below this
  reorder_qty INTEGER DEFAULT 50,  -- Suggested reorder quantity
  last_counted_at INTEGER,   -- Timestamp of last physical count
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES inventory_products(id),
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
  UNIQUE (user_id, product_id, location_id)
);

-- pos_terminals (Point of Sale checkout stations - 8 terminals)
CREATE TABLE IF NOT EXISTS pos_terminals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  terminal_num INTEGER NOT NULL, -- 1-8
  location_id TEXT NOT NULL,
  terminal_name TEXT,       -- Friendly name (e.g., "Register 1", "Checkout A")
  is_active INTEGER DEFAULT 1,
  last_online INTEGER,      -- Last activity timestamp
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
  UNIQUE (user_id, terminal_num)
);

-- pos_sales (completed transactions at POS)
CREATE TABLE IF NOT EXISTS pos_sales (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  terminal_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  transaction_num TEXT NOT NULL, -- Unique receipt number
  total_items INTEGER NOT NULL,  -- Count of items in transaction
  subtotal REAL NOT NULL,    -- Sum before tax
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method TEXT,      -- "cash", "card", "check", etc.
  customer_info TEXT,       -- Optional JSON: name, phone, etc.
  notes TEXT,
  voided INTEGER DEFAULT 0, -- 1 if transaction was voided
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (terminal_id) REFERENCES pos_terminals(id),
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
  UNIQUE (user_id, transaction_num)
);

-- pos_sale_items (line items in each POS transaction)
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL, -- Price at time of sale
  unit_cost REAL NOT NULL,  -- Cost at time of sale (for profit calc)
  line_total REAL NOT NULL, -- quantity * unit_price
  line_profit REAL,         -- (unit_price - unit_cost) * quantity
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sale_id) REFERENCES pos_sales(id),
  FOREIGN KEY (product_id) REFERENCES inventory_products(id)
);

-- cost_accounting (profit/loss tracking and reporting)
CREATE TABLE IF NOT EXISTS cost_accounting (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_period TEXT NOT NULL, -- ISO date (YYYY-MM-DD) for daily totals or "YYYY-MM" for monthly
  location_id TEXT,         -- NULL for company-wide, specific location_id for location totals
  total_sales REAL DEFAULT 0,     -- Sum of all sales revenue
  total_cost REAL DEFAULT 0,      -- Sum of COGS (cost of goods sold)
  total_profit REAL DEFAULT 0,    -- total_sales - total_cost
  profit_margin REAL DEFAULT 0,   -- (profit / sales) * 100
  transaction_count INTEGER DEFAULT 0, -- Number of transactions
  items_sold INTEGER DEFAULT 0,   -- Total units sold
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
  UNIQUE (user_id, date_period, location_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_results_user_id ON academy_results(user_id);
CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_conditions_user_id ON health_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_meds_user_id ON health_meds(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_user_id ON inventory_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_user_id ON inventory_products(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_user_id ON inventory_stock(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_location ON inventory_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_pos_terminals_user_id ON pos_terminals(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_terminals_location ON pos_terminals(location_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_user_id ON pos_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_location ON pos_sales(location_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_terminal ON pos_sales(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created ON pos_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale_id ON pos_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_product ON pos_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_accounting_user ON cost_accounting(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_accounting_period ON cost_accounting(date_period);
CREATE INDEX IF NOT EXISTS idx_cost_accounting_location ON cost_accounting(location_id);
