-- =============================================================
-- migration: 003_buyer_matching_mandi.sql
-- purpose:   add buyer matching and mandi infrastructure
-- =============================================================

create table if not exists buyer_demand_profiles (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references users(id) on delete cascade,
  crop_type text not null,
  min_quantity_kg numeric check (min_quantity_kg >= 0),
  max_quantity_kg numeric check (max_quantity_kg >= 0),
  preferred_location text,
  quality_grade text check (quality_grade in ('A', 'B', 'C')),
  active boolean not null default true,
  is_demo boolean not null default false, -- Explicitly mark synthetic SIH demo data
  created_at timestamptz default now()
);

create table if not exists buyer_matches (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid references produce_lots(id) on delete cascade,
  buyer_id uuid references users(id) on delete cascade,
  match_score numeric not null, -- Deterministic rule-based score (max 100), NOT AI ML confidence
  match_reasons jsonb not null default '{}'::jsonb,
  status text not null default 'suggested' check (status in ('suggested', 'contacted', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(lot_id, buyer_id) -- Prevent duplicate active match rows
);

-- Note: mandi_prices is omitted intentionally since we use a graceful unavailable API state
-- for the live external data rather than persisting fabricated prices.

-- =============================================================
-- SEED DATA (SIH DEMO ONLY)
-- =============================================================

-- Deterministic UUIDs for Demo Buyers
-- Demo Buyer 1: dba11111-1111-1111-1111-111111111111
-- Demo Buyer 2: dba22222-2222-2222-2222-222222222222

do $$
begin
  -- Insert demo users if they don't exist
  if not exists (select 1 from users where id = 'dba11111-1111-1111-1111-111111111111') then
    insert into users (id, name, email, role) 
    values ('dba11111-1111-1111-1111-111111111111', 'FreshMart Foods (DEMO)', 'buyer1@demo.agrisync.local', 'buyer');
  end if;

  if not exists (select 1 from users where id = 'dba22222-2222-2222-2222-222222222222') then
    insert into users (id, name, email, role) 
    values ('dba22222-2222-2222-2222-222222222222', 'AgriCorp Processing (DEMO)', 'buyer2@demo.agrisync.local', 'buyer');
  end if;
  
  -- Insert demo demand profiles if they don't exist
  if not exists (select 1 from buyer_demand_profiles where buyer_id = 'dba11111-1111-1111-1111-111111111111') then
    insert into buyer_demand_profiles (buyer_id, crop_type, min_quantity_kg, max_quantity_kg, preferred_location, quality_grade, is_demo)
    values 
      ('dba11111-1111-1111-1111-111111111111', 'Tomatoes', 100, 1000, 'North Perimeter', 'A', true),
      ('dba11111-1111-1111-1111-111111111111', 'Potatoes', 500, 5000, 'North Perimeter', 'B', true);
  end if;

  if not exists (select 1 from buyer_demand_profiles where buyer_id = 'dba22222-2222-2222-2222-222222222222') then
    insert into buyer_demand_profiles (buyer_id, crop_type, min_quantity_kg, max_quantity_kg, preferred_location, quality_grade, is_demo)
    values 
      ('dba22222-2222-2222-2222-222222222222', 'Onions', 200, 2000, 'South Hub', 'A', true),
      ('dba22222-2222-2222-2222-222222222222', 'Tomatoes', 50, 500, 'East Wing', 'B', true);
  end if;
end;
$$;
