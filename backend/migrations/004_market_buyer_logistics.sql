-- AgriSync Phase 2 Migration: Market Intelligence, Buyer Matching & Logistics
-- Migration: 004_market_buyer_logistics.sql
-- Owner: Tej

-- 1. Create produce_lots table if not exists (Krushn's table fallback compatibility)
CREATE TABLE IF NOT EXISTS produce_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  crop_type TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  grade TEXT NOT NULL DEFAULT 'A',
  harvest_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mandi Prices Table (Stores real AGMARKNET data and historical mock fallback)
CREATE TABLE IF NOT EXISTS mandi_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type TEXT NOT NULL,
  market_name TEXT NOT NULL,
  state TEXT NOT NULL,
  min_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  modal_price NUMERIC NOT NULL,
  price_date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('real', 'mock')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandi_prices_lookup ON mandi_prices (crop_type, state, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_trend ON mandi_prices (crop_type, market_name, price_date ASC);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_source ON mandi_prices (source);

-- 3. Buyer Demand Profiles Table
CREATE TABLE IF NOT EXISTS buyer_demand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  company_name TEXT,
  crop_type TEXT NOT NULL,
  min_quantity_kg NUMERIC NOT NULL,
  preferred_grade TEXT NOT NULL DEFAULT 'any',
  location TEXT NOT NULL,
  state TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_demand_crop ON buyer_demand_profiles (crop_type, min_quantity_kg);

-- 4. Buyer Matches Table
CREATE TABLE IF NOT EXISTS buyer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES buyer_demand_profiles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'interested', 'accepted', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_matches_lot ON buyer_matches (lot_id);
CREATE INDEX IF NOT EXISTS idx_buyer_matches_buyer ON buyer_matches (buyer_id);

-- 5. Logistics Facilities Table (Seed Storage and Transport Options)
CREATE TABLE IF NOT EXISTS logistics_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cold_storage', 'warehouse', 'transport_provider')),
  location TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity_kg NUMERIC NOT NULL,
  cost_per_day NUMERIC NOT NULL,
  contact_phone TEXT,
  perishable_compatible BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_type_state ON logistics_facilities (type, state);

-- ==========================================
-- SEED DATA (Demo Storage, Facilities, Buyers & Mock Mandi Trends)
-- ==========================================

-- Seed Logistics Facilities (Clearly labeled demo Indian facilities)
INSERT INTO logistics_facilities (facility_name, type, location, state, capacity_kg, cost_per_day, contact_phone, perishable_compatible, rating)
VALUES
  ('Mahafresh Cold Chain Hub', 'cold_storage', 'Nashik APMC Corridor', 'Maharashtra', 50000, 350.00, '+91-9823011223', true, 4.8),
  ('Kisan Agri Mega Warehouse', 'warehouse', 'Sanwer Road, Indore', 'Madhya Pradesh', 200000, 180.00, '+91-9876543210', false, 4.6),
  ('Godavari Cold Storage Depot', 'cold_storage', 'Rajahmundry Bypass', 'Andhra Pradesh', 35000, 290.00, '+91-9440123456', true, 4.7),
  ('Gujarat Agri Logistic Park', 'warehouse', 'Sachin GIDC, Surat', 'Gujarat', 120000, 210.00, '+91-9825098765', false, 4.5),
  ('Punjab Silo Storage Terminal', 'warehouse', 'GT Road, Ludhiana', 'Punjab', 300000, 150.00, '+91-9814054321', false, 4.9),
  ('Bangalore Rural Cold Hub', 'cold_storage', 'Hoskote Industrial Area', 'Karnataka', 40000, 320.00, '+91-9845012398', true, 4.7),
  ('TransKisan Fleet Services', 'transport_provider', 'Azadpur Mandi Hub, Delhi', 'Delhi', 15000, 1200.00, '+91-9911223344', true, 4.6)
ON CONFLICT DO NOTHING;

-- Seed Sample Demo Buyer Demand Profiles
INSERT INTO buyer_demand_profiles (buyer_name, company_name, crop_type, min_quantity_kg, preferred_grade, location, state, contact_phone)
VALUES
  ('Reliance Retail Fresh Sourcing', 'Reliance Retail Ltd', 'Tomato', 1000, 'A', 'Nashik', 'Maharashtra', '+91-9822019988'),
  ('BigBasket Direct Farm Sourcing', 'Supermarket Grocery Supplies', 'Tomato', 500, 'any', 'Kollam', 'Keralam', '+91-9844098877'),
  ('AgroCorp Grain Exporters', 'AgroCorp International', 'Wheat', 5000, 'A', 'Indore', 'Madhya Pradesh', '+91-9877023311'),
  ('Kisan Mitra FPO Federation', 'Kisan Mitra Producer Co.', 'Onion', 2000, 'B', 'Lasalgaon', 'Maharashtra', '+91-9823045566'),
  ('ITC Agri-Business Division', 'ITC Limited', 'Soybean', 3000, 'A', 'Ujjain', 'Madhya Pradesh', '+91-9893012233')
ON CONFLICT DO NOTHING;

-- Seed Sample Produce Lots for initial testing & fallback
INSERT INTO produce_lots (id, crop_type, quantity_kg, grade, harvest_date, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tomato', 1200, 'A', CURRENT_DATE - INTERVAL '2 days', 'available'),
  ('22222222-2222-2222-2222-222222222222', 'Wheat', 6000, 'A', CURRENT_DATE - INTERVAL '10 days', 'available'),
  ('33333333-3333-3333-3333-333333333333', 'Onion', 2500, 'B', CURRENT_DATE - INTERVAL '5 days', 'available'),
  ('44444444-4444-4444-4444-444444444444', 'Soybean', 4000, 'A', CURRENT_DATE - INTERVAL '14 days', 'available')
ON CONFLICT DO NOTHING;

-- Seed Historical Mock Mandi Prices (2-3 weeks of trend data, tagged source = 'mock')
-- Tomato (Rising Trend)
INSERT INTO mandi_prices (crop_type, market_name, state, min_price, max_price, modal_price, price_date, source)
VALUES
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 900, 1100, 1000, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 950, 1150, 1050, CURRENT_DATE - INTERVAL '12 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1000, 1200, 1100, CURRENT_DATE - INTERVAL '10 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1050, 1250, 1150, CURRENT_DATE - INTERVAL '8 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1100, 1300, 1200, CURRENT_DATE - INTERVAL '6 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1150, 1350, 1250, CURRENT_DATE - INTERVAL '4 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1200, 1400, 1300, CURRENT_DATE - INTERVAL '2 days', 'mock'),
  ('Tomato', 'Somala APMC', 'Andhra Pradesh', 1250, 1450, 1350, CURRENT_DATE, 'mock'),

  -- Wheat (Stable High Trend)
  ('Wheat', 'Indore APMC', 'Madhya Pradesh', 2350, 2550, 2450, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Wheat', 'Indore APMC', 'Madhya Pradesh', 2380, 2580, 2480, CURRENT_DATE - INTERVAL '10 days', 'mock'),
  ('Wheat', 'Indore APMC', 'Madhya Pradesh', 2400, 2600, 2500, CURRENT_DATE - INTERVAL '7 days', 'mock'),
  ('Wheat', 'Indore APMC', 'Madhya Pradesh', 2420, 2620, 2520, CURRENT_DATE - INTERVAL '4 days', 'mock'),
  ('Wheat', 'Indore APMC', 'Madhya Pradesh', 2450, 2650, 2550, CURRENT_DATE, 'mock'),

  -- Onion (Falling Trend)
  ('Onion', 'Lasalgaon APMC', 'Maharashtra', 2200, 2600, 2400, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Onion', 'Lasalgaon APMC', 'Maharashtra', 2100, 2500, 2300, CURRENT_DATE - INTERVAL '10 days', 'mock'),
  ('Onion', 'Lasalgaon APMC', 'Maharashtra', 2000, 2400, 2200, CURRENT_DATE - INTERVAL '7 days', 'mock'),
  ('Onion', 'Lasalgaon APMC', 'Maharashtra', 1900, 2300, 2100, CURRENT_DATE - INTERVAL '4 days', 'mock'),
  ('Onion', 'Lasalgaon APMC', 'Maharashtra', 1800, 2200, 2000, CURRENT_DATE, 'mock'),

  -- Rice (Paddy)
  ('Rice', 'Karnal APMC', 'Haryana', 3100, 3400, 3250, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Rice', 'Karnal APMC', 'Haryana', 3150, 3450, 3300, CURRENT_DATE - INTERVAL '7 days', 'mock'),
  ('Rice', 'Karnal APMC', 'Haryana', 3200, 3500, 3350, CURRENT_DATE, 'mock'),

  -- Potato
  ('Potato', 'Agra APMC', 'Uttar Pradesh', 1400, 1700, 1550, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Potato', 'Agra APMC', 'Uttar Pradesh', 1450, 1750, 1600, CURRENT_DATE - INTERVAL '7 days', 'mock'),
  ('Potato', 'Agra APMC', 'Uttar Pradesh', 1500, 1800, 1650, CURRENT_DATE, 'mock'),

  -- Soybean
  ('Soybean', 'Ujjain APMC', 'Madhya Pradesh', 4400, 4800, 4600, CURRENT_DATE - INTERVAL '14 days', 'mock'),
  ('Soybean', 'Ujjain APMC', 'Madhya Pradesh', 4500, 4900, 4700, CURRENT_DATE - INTERVAL '7 days', 'mock'),
  ('Soybean', 'Ujjain APMC', 'Madhya Pradesh', 4600, 5000, 4800, CURRENT_DATE, 'mock')
ON CONFLICT DO NOTHING;
