-- SQL migration: create user_storage table used by lib/user-storage.ts
-- Run this in your Supabase SQL editor (or via psql)

create table if not exists public.user_storage (
  user_id uuid not null,
  key text not null,
  value text,
  primary key (user_id, key)
);

-- Optional: accelerate lookups by creating a simple index on user_id
create index if not exists idx_user_storage_user_id on public.user_storage (user_id);
