-- =============================================================
-- migration: 002_produce_lots_procurement.sql
-- purpose:   create post-harvest produce lot management,
--            procurement centre, slot booking, and transaction
--            tables for AgriSync Phase 1A
-- author:    krushn (feature/krushn-postharvest-core)
-- phase:     1a -- database foundation
-- run in:    supabase sql editor (development only)
-- depends:   schema.sql (users, farms tables must exist)
--            001_users_role.sql (users.role must exist)
-- =============================================================
--
-- conventions followed (matching existing schema.sql):
--   * uuid primary key default gen_random_uuid()
--   * timestamptz default now()
--   * create table if not exists
--   * create index if not exists
--   * lowercase sql keywords, snake_case identifiers
--
-- delete behavior rationale:
--   post-harvest records represent real business/operational data.
--   cascade deletes are intentionally avoided on business records.
--   on delete restrict / no action is used where a referenced
--   record must not disappear while dependent records exist.
--   on delete set null is used where the reference is optional
--   (e.g., buyer_id, booking_id on transactions).
-- =============================================================


-- =============================================================
-- table: produce_lots
-- represents a batch of harvested produce submitted by a farmer.
-- =============================================================
create table if not exists produce_lots (
  id                       uuid        primary key default gen_random_uuid(),

  -- owning farm; restricts farm deletion while lots exist
  farm_id                  uuid        not null
                             references farms(id) on delete restrict,

  crop_type                text        not null,

  -- weight in kilograms; must be a positive value
  quantity_kg              numeric     not null
                             constraint produce_lots_quantity_positive
                               check (quantity_kg > 0),

  quality_notes            text,

  -- array of supabase storage public urls for produce photos
  photo_urls               text[],

  -- cv grading result: a=best, b=acceptable, c=low; null until
  -- the grading service has processed this lot
  grade                    text
                             constraint produce_lots_grade_check
                               check (grade in ('A', 'B', 'C')),

  -- structured defect flags returned by the cv grading service
  defect_flags             jsonb,

  -- optional yield adjustment factor from grading (-100 to 100)
  expected_yield_adjustment numeric,

  -- lifecycle status of this produce lot
  status                   text        not null default 'listed'
                             constraint produce_lots_status_check
                               check (status in ('listed', 'booked', 'matched', 'sold')),

  created_at               timestamptz not null default now()
);

-- indexes for common api query patterns
create index if not exists idx_produce_lots_farm_id
  on produce_lots (farm_id);

create index if not exists idx_produce_lots_status
  on produce_lots (status);


-- =============================================================
-- table: procurement_centres
-- physical or virtual centres where farmers bring produce for
-- procurement. operated by a procurement_operator user.
-- =============================================================
create table if not exists procurement_centres (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  location          text,

  -- max produce lots the centre can handle per calendar day
  daily_capacity    integer
                      constraint procurement_centres_capacity_positive
                        check (daily_capacity > 0),

  -- the user responsible for managing this centre.
  -- nullable: allows centres to be seeded before operators are
  -- assigned, and prevents cascade-delete if the operator's
  -- user record is removed.
  operator_user_id  uuid
                      references users(id) on delete set null
);


-- =============================================================
-- table: procurement_slots
-- specific time slots available for booking at a centre.
-- a slot defines a time window and the maximum number of
-- concurrent lot bookings it can accommodate.
-- =============================================================
create table if not exists procurement_slots (
  id                uuid        primary key default gen_random_uuid(),

  -- restricts centre deletion while slots exist
  centre_id         uuid        not null
                      references procurement_centres(id) on delete restrict,

  slot_time         timestamptz not null,

  -- maximum simultaneous bookings allowed for this slot
  max_bookings      integer     not null
                      constraint procurement_slots_max_positive
                        check (max_bookings > 0),

  -- running count; must not exceed max_bookings
  current_bookings  integer     not null default 0
                      constraint procurement_slots_bookings_non_negative
                        check (current_bookings >= 0),

  -- enforce capacity ceiling at the database level
  constraint procurement_slots_capacity_ceiling
    check (current_bookings <= max_bookings)
);

-- indexes for slot lookup and calendar queries
create index if not exists idx_procurement_slots_centre_id
  on procurement_slots (centre_id);

create index if not exists idx_procurement_slots_slot_time
  on procurement_slots (slot_time);


-- =============================================================
-- table: slot_bookings
-- a farmer books a specific procurement slot for a produce lot.
-- tracks queue position and processing status.
-- =============================================================
create table if not exists slot_bookings (
  id              uuid        primary key default gen_random_uuid(),

  -- restricts slot deletion while bookings reference it
  slot_id         uuid        not null
                    references procurement_slots(id) on delete restrict,

  -- restricts lot deletion while a booking references it
  lot_id          uuid        not null
                    references produce_lots(id) on delete restrict,

  -- the farmer who made this booking
  farmer_id       uuid        not null
                    references users(id) on delete restrict,

  -- position in the processing queue; positive integer when set
  queue_position  integer
                    constraint slot_bookings_queue_position_positive
                      check (queue_position > 0),

  -- booking lifecycle status
  status          text        not null default 'waiting'
                    constraint slot_bookings_status_check
                      check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),

  booked_at       timestamptz not null default now()
);

-- indexes for queue management and api access patterns
create index if not exists idx_slot_bookings_slot_id
  on slot_bookings (slot_id);

create index if not exists idx_slot_bookings_lot_id
  on slot_bookings (lot_id);

create index if not exists idx_slot_bookings_farmer_id
  on slot_bookings (farmer_id);

create index if not exists idx_slot_bookings_status
  on slot_bookings (status);


-- =============================================================
-- table: transactions
-- payment and procurement status record for a produce lot.
-- created when a lot is matched with a buyer and payment begins.
-- =============================================================
create table if not exists transactions (
  id                   uuid        primary key default gen_random_uuid(),

  -- restricts lot deletion while a transaction references it
  lot_id               uuid        not null
                         references produce_lots(id) on delete restrict,

  -- optional: the specific booking this transaction arose from
  booking_id           uuid
                         references slot_bookings(id) on delete set null,

  -- optional: the buyer user; nullable until a buyer is matched
  buyer_id             uuid
                         references users(id) on delete set null,

  -- overall procurement lifecycle status
  procurement_status   text        not null default 'pending'
                         constraint transactions_procurement_status_check
                           check (procurement_status in ('pending', 'in_progress', 'completed')),

  -- payment settlement status
  payment_status       text        not null default 'unpaid'
                         constraint transactions_payment_status_check
                           check (payment_status in ('unpaid', 'partial', 'paid')),

  -- agreed or settled transaction amount; null until finalized
  amount               numeric
                         constraint transactions_amount_non_negative
                           check (amount >= 0),

  -- last status update timestamp; manually set by the api on
  -- every relevant write (no trigger; follows project convention)
  updated_at           timestamptz not null default now()
);

-- indexes for transaction lookup by lot and buyer
create index if not exists idx_transactions_lot_id
  on transactions (lot_id);

create index if not exists idx_transactions_buyer_id
  on transactions (buyer_id);


-- =============================================================
-- seed data: demo procurement centres and slots
-- clearly marked as demo data; safe for all environments.
-- operator_user_id is null to avoid requiring specific user rows.
-- no fake produce lots, farms, or transactions are seeded.
--
-- idempotency strategy:
--   centres: WHERE NOT EXISTS guards on both id AND name.
--     this prevents duplicates whether the migration is re-run
--     with the same fixed uuid, OR if a row with the same name
--     already exists from a different seed run with a different id.
--     procurement_centres has no unique constraint on name (by
--     design — operators can have similarly named centres), so
--     the guard is applied here at seed level without touching
--     the schema.
--   slots: ON CONFLICT (id) DO NOTHING with fixed deterministic
--     uuids. slots have no natural uniqueness candidate beyond
--     their surrogate id, so fixed-uuid conflict is sufficient.
-- =============================================================

-- procurement centre: nashik
-- guarded on both fixed uuid and name to prevent any duplicate
insert into procurement_centres (id, name, location, daily_capacity, operator_user_id)
select
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'AgriSync Demo Centre - Nashik',
  'Nashik, Maharashtra',
  120,
  null
where not exists (
  select 1 from procurement_centres
  where id   = 'a1000000-0000-0000-0000-000000000001'::uuid
     or name = 'AgriSync Demo Centre - Nashik'
);

-- procurement centre: pune
insert into procurement_centres (id, name, location, daily_capacity, operator_user_id)
select
  'a1000000-0000-0000-0000-000000000002'::uuid,
  'AgriSync Demo Centre - Pune',
  'Pune, Maharashtra',
  80,
  null
where not exists (
  select 1 from procurement_centres
  where id   = 'a1000000-0000-0000-0000-000000000002'::uuid
     or name = 'AgriSync Demo Centre - Pune'
);

-- procurement centre: nagpur
insert into procurement_centres (id, name, location, daily_capacity, operator_user_id)
select
  'a1000000-0000-0000-0000-000000000003'::uuid,
  'AgriSync Demo Centre - Nagpur',
  'Nagpur, Maharashtra',
  100,
  null
where not exists (
  select 1 from procurement_centres
  where id   = 'a1000000-0000-0000-0000-000000000003'::uuid
     or name = 'AgriSync Demo Centre - Nagpur'
);

-- procurement slots for nashik centre
-- fixed deterministic uuids; on conflict (id) do nothing is
-- sufficient because uuid is the only natural uniqueness key
insert into procurement_slots (id, centre_id, slot_time, max_bookings, current_bookings)
values
  (
    'b2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    now() + interval '1 day',
    10,
    0
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    now() + interval '2 days',
    10,
    0
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    now() + interval '3 days',
    10,
    0
  )
on conflict (id) do nothing;

-- procurement slots for pune centre
insert into procurement_slots (id, centre_id, slot_time, max_bookings, current_bookings)
values
  (
    'b2000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    now() + interval '1 day',
    8,
    0
  ),
  (
    'b2000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    now() + interval '2 days',
    8,
    0
  )
on conflict (id) do nothing;

-- procurement slots for nagpur centre
insert into procurement_slots (id, centre_id, slot_time, max_bookings, current_bookings)
values
  (
    'b2000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000003',
    now() + interval '1 day',
    12,
    0
  ),
  (
    'b2000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000003',
    now() + interval '2 days',
    12,
    0
  )
on conflict (id) do nothing;
