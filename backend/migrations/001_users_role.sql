-- =============================================================
-- migration: 001_users_role.sql
-- purpose:   add role column to the users table
-- author:    krushn (feature/krushn-postharvest-core)
-- phase:     1a -- database foundation
-- run in:    supabase sql editor (development only)
-- =============================================================
--
-- safe to run against the existing schema defined in schema.sql.
-- does not alter any existing column, row, or constraint.
-- adds role column with a default so existing rows are back-filled
-- automatically by postgres without requiring a separate update.
--
-- supported roles:
--   farmer              -- farm owner submitting produce lots
--   buyer               -- purchases produce at procurement centre
--   procurement_operator -- manages centre slots and queue
--   admin               -- system-level access
--
-- NOTE: the existing auth middleware falls back to a hardcoded
-- default user. authentication enforcement (Phase 1B) is out of
-- scope here. this migration only adds the database column.
-- =============================================================

-- add the role column to users if it does not already exist.
-- using a do/end block so this is idempotent -- safe to re-run.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'users'
      and column_name  = 'role'
  ) then
    alter table users
      add column role text not null default 'farmer';
  end if;
end;
$$;

-- add check constraint enforcing allowed role values if it does
-- not already exist.
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema     = 'public'
      and table_name       = 'users'
      and constraint_name  = 'users_role_check'
  ) then
    alter table users
      add constraint users_role_check
        check (role in ('farmer', 'buyer', 'procurement_operator', 'admin'));
  end if;
end;
$$;
