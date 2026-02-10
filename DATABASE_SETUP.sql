-- 1. DESIGNS TABLE
-- Stores all cloth designs and their inventory stock levels
CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    fabric TEXT NOT NULL,
    imageUrl TEXT,
    inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
    childType TEXT DEFAULT 'none',
    createdAt BIGINT NOT NULL
);

-- Enable Row Level Security (Initial setup: Allow all access)
-- Note: In production, you should refine these for Staff vs Public roles
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON designs FOR SELECT USING (true);
CREATE POLICY "Public Delete Access" ON designs FOR DELETE USING (true);
CREATE POLICY "Staff Full Access" ON designs FOR ALL USING (true);


-- 2. ORDERS TABLE
-- Stores customer orders pending acceptance by staff
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    designId TEXT REFERENCES designs(id) ON DELETE CASCADE,
    comboType TEXT NOT NULL,
    selectedSizes JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt BIGINT NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff Full Access" ON orders FOR ALL USING (true);


-- 3. STORAGE SETUP
-- You must manually create a bucket named 'clothes' and set it to 'Public'
-- Or run this if you have administrative privileges:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('clothes', 'clothes', true);
