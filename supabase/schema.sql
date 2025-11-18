-- supabase/schema.sql
-- TODO v2.0.6 tables with RLS (bypassed by service role).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category text not null check (category in ('life','work','distraction')),
  title text not null,
  note text,
  priority int not null default 2 check (priority between 1 and 3),
  pinned boolean not null default false,
  due_date date,
  repeat text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_day_status (
  task_id uuid references public.tasks(id) on delete cascade,
  date date not null,
  status text not null check (status in ('done','skipped')),
  created_at timestamptz not null default now(),
  primary key (task_id, date)
);

-- Enable RLS
alter table public.tasks enable row level security;
alter table public.task_day_status enable row level security;

-- Policies (assumes auth; service role bypasses)
drop policy if exists "Users can CRUD their own tasks" on public.tasks;
create policy "Users can CRUD their own tasks"
on public.tasks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD their own statuses" on public.task_day_status;
create policy "Users can CRUD their own statuses"
on public.task_day_status
for all
to authenticated
using (exists (select 1 from public.tasks t where t.id = task_day_status.task_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.tasks t where t.id = task_day_status.task_id and t.user_id = auth.uid()));
