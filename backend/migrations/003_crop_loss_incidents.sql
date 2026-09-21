-- Migration 003: Crop-Loss Incident Reporting
-- Created by: Aayush (Pre-Harvest Module)

create table if not exists crop_loss_incidents (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  detection_id uuid references detections(id) on delete set null,
  crop_type text not null,
  affected_area_estimate text not null,
  notes text,
  reported_at timestamptz default now(),
  confirmed_by_farmer boolean default true
);

create index if not exists idx_crop_loss_incidents_farm_id on crop_loss_incidents (farm_id);
create index if not exists idx_crop_loss_incidents_reported_at on crop_loss_incidents (reported_at desc);
