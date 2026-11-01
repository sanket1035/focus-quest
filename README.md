# Focus Quest

Two-player daily habit tracker: points, streaks, a leaderboard and a calendar. Static site (GitHub Pages) + Supabase (login and database).

Pages: `login.html`, `index.html` (scoreboard, today's quests, log form), `calendar.html` (streak calendar, stats, history).

## Rules the database enforces
- Login required. Only the two accounts you create can read or write.
- The date is set by the server (India time), so nobody can backdate or change the phone clock.
- You can write only your own entry for today. Nobody can delete entries.

## Setup
1. Supabase: SQL Editor, run `schema_v2.sql` (this drops the old `logs` table).
2. Authentication, Users: add the two users with email and password (tick auto-confirm).
3. Authentication, Sign In / Providers: turn off "Allow new users to sign up".
4. Put the two emails (lowercase) in `config.js` under `PLAYERS`.
5. Settings, Pages: deploy from `main`, root.

## Preview without login
Add `?demo` to any page link, for example `index.html?demo`. Light or dark follows the device setting.

## Points
Full day: coding 10 each (max 30), aptitude correct 1 each (max 30, +5 at 20+ attempted and 70%+), theory + DS/ML up to 15, English up to 20, full-day bonus +10. Saying "no prep" on a full day scores English only. Light days: English only, max 20. Streak +2 per day (max 20). Missed day: -10 full, -5 light.

## Profile photos
Each player has a `photo` path in `config.js` (default `img/sanket.png`, `img/purva.png`). The photo is tied to the account by the email next to it: whoever logs in with that email sees their own photo, and both photos show on the scoreboard and calendar. Put a square-ish JPG (about 400x400) in the `img/` folder with that file name. If the file is missing, the first letter of the name is shown instead. The repo is public, so the photos are public too.
