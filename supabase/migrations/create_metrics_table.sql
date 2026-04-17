-- Metrics tabel voor WhatsApp metingen (gewicht, stappen, etc.)
create table if not exists public.metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  type        text not null default 'anders', -- gewicht | stappen | slaap | calorie | anders
  waarde      text not null,
  datum       date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Index voor snelle queries per user
create index if not exists metrics_user_id_idx on public.metrics (user_id, datum desc);

-- RLS: alleen eigen rijen lezen/schrijven
alter table public.metrics enable row level security;

create policy "Users can read own metrics"
  on public.metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert own metrics"
  on public.metrics for insert
  with check (auth.uid() = user_id);

-- Service role (webhook) mag altijd inserten
create policy "Service role full access"
  on public.metrics for all
  using (auth.role() = 'service_role');
