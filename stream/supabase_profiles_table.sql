-- Run this in Supabase Dashboard > SQL Editor

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  image text not null,
  locked boolean default false,
  display_order int default 0,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable Row Level Security so users can only see/edit their own profiles
alter table profiles enable row level security;

create policy "Users can manage their own profiles"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
