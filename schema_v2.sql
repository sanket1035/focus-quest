-- Focus Quest v2: login required, own-rows-only writes, server-set date, no deletes.
-- WARNING: drops the old logs table and its data. Run in Supabase: SQL Editor > New query > Run.
drop table if exists logs;
create table logs (
  id bigint generated always as identity primary key,
  player text not null default lower(auth.jwt() ->> 'email'),          -- set by the server from the login
  day date not null default ((now() at time zone 'Asia/Kolkata')::date), -- set by the server, cannot be backdated
  did_prep boolean not null default false,
  coding int not null default 0 check (coding between 0 and 30),
  apt_attempted int not null default 0 check (apt_attempted between 0 and 300),
  apt_correct int not null default 0 check (apt_correct between 0 and 300),
  theory_min int not null default 0 check (theory_min between 0 and 600),
  english_min int not null default 0 check (english_min between 0 and 600),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (player, day),
  check (apt_correct <= apt_attempted)
);
alter table logs enable row level security;
revoke all on logs from anon;
create policy "logged-in users read all" on logs for select to authenticated using (true);
create policy "insert own, today only" on logs for insert to authenticated
  with check (player = lower(auth.jwt() ->> 'email') and day = ((now() at time zone 'Asia/Kolkata')::date));
create policy "update own, today only" on logs for update to authenticated
  using (player = lower(auth.jwt() ->> 'email') and day = ((now() at time zone 'Asia/Kolkata')::date))
  with check (player = lower(auth.jwt() ->> 'email') and day = ((now() at time zone 'Asia/Kolkata')::date));
-- No delete policy on purpose: nobody can delete any entry, including their own.
