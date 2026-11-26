-- 我的剧本：在 Supabase 的 SQL Editor 里整段运行一次，可重复运行。

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  prompt text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scripts enable row level security;

drop policy if exists "own scripts" on public.scripts;
create policy "own scripts" on public.scripts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
