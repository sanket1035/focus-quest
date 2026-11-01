-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists logs (
  id bigint generated always as identity primary key,
  player text not null,
  day date not null,
  coding int not null default 0,          -- coding questions solved
  apt_attempted int not null default 0,   -- aptitude questions attempted
  apt_correct int not null default 0,     -- aptitude questions correct
  theory_min int not null default 0,      -- OOP/OS/DBMS/AI-ML theory minutes
  english_min int not null default 0,     -- English speaking/communication minutes
  english_only boolean not null default false, -- spoke only English to each other today
  notes text default '',
  created_at timestamptz default now(),
  unique (player, day)
);
alter table logs enable row level security;
-- Two-person private app: anon key can read and write. Keep the site link private.
create policy "read"   on logs for select using (true);
create policy "insert" on logs for insert with check (true);
create policy "update" on logs for update using (true);
