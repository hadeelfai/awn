-- Awn user-owned app data. Auth anonymous sign-in gives each installation
-- a user id; RLS ensures users can only access their own rows.

create table if not exists public.awn_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  client_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint awn_appointments_user_client_unique unique (user_id, client_id)
);

create table if not exists public.awn_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  client_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint awn_reports_user_client_unique unique (user_id, client_id)
);

create table if not exists public.awn_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  client_id text not null,
  role text not null check (role in ('user', 'awn', 'system')),
  payload jsonb not null,
  created_at timestamptz not null,
  constraint awn_chat_messages_user_client_unique unique (user_id, client_id)
);

alter table public.awn_appointments enable row level security;
alter table public.awn_reports enable row level security;
alter table public.awn_chat_messages enable row level security;

revoke all on public.awn_appointments, public.awn_reports,
  public.awn_chat_messages from anon, authenticated;
grant select, insert, update, delete on public.awn_appointments,
  public.awn_reports, public.awn_chat_messages to authenticated;

create policy "Users manage their own appointments"
  on public.awn_appointments for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own reports"
  on public.awn_reports for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own chat messages"
  on public.awn_chat_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
