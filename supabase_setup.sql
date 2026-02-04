-- TAILORPRO STORE SUPABASE INITIALIZATION SCRIPT

-- 1. Create the Products/Designs Table
CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    fabric TEXT,
    imageurl TEXT,
    inventory JSONB NOT NULL,
    childtype TEXT,
    label TEXT,
    createdat BIGINT NOT NULL
);

-- 2. Create the Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    designid TEXT REFERENCES designs(id) ON DELETE CASCADE,
    combotype TEXT NOT NULL,
    selectedsizes JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdat BIGINT NOT NULL
);

-- 3. Storage Setup Instructions
-- Go to Supabase Dashboard > Storage > New Bucket
-- Set Name: clothes
-- Set Public: Yes (Toggle ON)

-- 4. Enable Public Access Policies (RLS)
-- These allow the app to function with the Anon Key provided in .env

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Designs Policies
CREATE POLICY "Public Read Access" ON designs FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON designs FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access" ON designs FOR DELETE USING (true);

-- Orders Policies
CREATE POLICY "Public Read Access" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON orders FOR UPDATE USING (true);
