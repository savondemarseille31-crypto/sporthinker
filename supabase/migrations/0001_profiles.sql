-- ───────────────────────────────────────────────────────────────────────────
-- W2 — Comptes utilisateurs : table `profiles` + RLS + création auto à l'inscription
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard → SQL Editor → New query).
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'user',   -- 'user' | 'admin'
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chaque utilisateur ne voit/modifie que son propre profil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Création automatique du profil lors de l'inscription d'un utilisateur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
