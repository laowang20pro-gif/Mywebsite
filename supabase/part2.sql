-- 第二部分：素材库、剧集、分镜。在 Supabase 的 SQL Editor 里整段运行一次，可重复运行。

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('character','scene','prop','costume','other')),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number int not null,
  title text not null default '',
  synopsis text,
  created_at timestamptz not null default now()
);

create table if not exists public.storyboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  number int not null,
  title text not null default '',
  duration int not null default 5,
  prompt jsonb not null default '{}'::jsonb,
  asset_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['assets','episodes','storyboards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
