// Shared logic: config, auth, data, scoring, nav. Used by login.html, index.html, calendar.html.
(function () {
  const C = window.DUEL, Q = new URLSearchParams(location.search);
  const DEMO = Q.has('demo'), UI = Q.get('ui') || C.UI || 'skill';
  document.documentElement.dataset.ui = UI;
  const KEEP = (DEMO ? '?demo' : '') + (Q.get('ui') ? (DEMO ? '&' : '?') + 'ui=' + Q.get('ui') : '');
  // Today in India time. The database enforces the real date, so changing the phone clock does not help.
  const TODAY = DEMO ? '2026-11-14' : new Date(Date.now() + 19800000).toISOString().slice(0, 10);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) };
  const ALLDAYS = []; for (let d = C.START; d <= C.END; d = addDays(d, 1)) ALLDAYS.push(d);
  const mode = d => C.LIGHT.some(r => d >= r[0] && d <= r[1]) ? 'light' : 'full';
  const P = C.PLAYERS.map(p => ({ name: p.name, email: p.email.toLowerCase() }));

  // ---------- scoring ----------
  const engPts = l => Math.round(Math.min(l.english_min, 30) / 30 * 20);
  function dayPts(l) {
    if (mode(l.day) !== 'full' || !l.did_prep) return engPts(l);
    let p = Math.min(l.coding, 3) * 10 + Math.min(l.apt_correct, 30);
    if (l.apt_attempted >= 20 && l.apt_correct / l.apt_attempted >= .7) p += 5;
    p += Math.round(Math.min(l.theory_min, 60) / 60 * 15) + engPts(l);
    if (l.coding >= 2 && l.apt_attempted >= 20 && l.english_min >= 30) p += 10;
    return p;
  }
  function calc(logs, email) {
    const m = {}; logs.filter(l => l.player === email).forEach(l => m[l.day] = l);
    let tot = 0, streak = 0, best = 0, coding = 0, eng = 0, missed = 0, logged = 0; const status = {};
    for (const d of ALLDAYS) {
      const l = m[d];
      if (l) { streak++; logged++; tot += dayPts(l) + Math.min(streak * 2, 20); coding += l.coding; eng += l.english_min; status[d] = 'ok' }
      else if (d < TODAY) { streak = 0; missed++; tot -= (mode(d) === 'light' ? 5 : 10); status[d] = 'miss' }
      else status[d] = d === TODAY ? 'pending' : 'future';
      best = Math.max(best, streak);
    }
    return { tot, streak, best, coding, eng, missed, logged, status, today: m[TODAY] };
  }

  // ---------- data ----------
  let sb = null, DL = [];
  if (DEMO) {
    let s = 7; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 };
    P.forEach((p, i) => ALLDAYS.filter(d => d < TODAY).forEach(d => {
      if (r() < .92 - i * .06) {
        const f = mode(d) === 'full', prep = f && r() < .88;
        DL.push({ player: p.email, day: d, did_prep: prep, coding: prep ? Math.round(1 + r() * 2) : 0, apt_attempted: prep ? Math.round(15 + r() * 20) : 0, apt_correct: prep ? Math.round(10 + r() * 18) : 0, theory_min: prep ? Math.round(40 + r() * 30) : 0, english_min: Math.round(20 + r() * 15), notes: prep ? 'Strings, SQL joins' : 'English talk' });
      }
    }));
    DL.forEach(l => { l.apt_correct = Math.min(l.apt_correct, l.apt_attempted) });
  } else sb = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);

  async function guard() {
    if (DEMO) return { name: P[0].name, email: P[0].email };
    const { data } = await sb.auth.getSession();
    if (!data.session) { location.replace('login.html' + KEEP); return null }
    const email = (data.session.user.email || '').toLowerCase(), me = P.find(p => p.email === email);
    if (!me) { document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif">This account is not one of the two players. Check the emails in config.js.</div>'; return null }
    return me;
  }
  async function fetchLogs() {
    if (DEMO) return DL.slice();
    const { data, error } = await sb.from('logs').select('*').order('day', { ascending: false });
    if (error) throw error; return data;
  }
  async function saveLog(row, me) {
    if (DEMO) { DL = DL.filter(l => !(l.player === me.email && l.day === TODAY)); DL.push({ ...row, player: me.email, day: TODAY }); return {} }
    // player and day are filled in by the database, not by the browser.
    return sb.from('logs').upsert(row, { onConflict: 'player,day' });
  }
  async function login(email, password) { return sb.auth.signInWithPassword({ email, password }) }
  async function logout() { if (!DEMO) await sb.auth.signOut(); location.replace('login.html' + KEEP) }

  // ---------- nav ----------
  function nav(active, me) {
    const items = [['index.html', 'dashboard', '🏠', 'Dashboard'], ['calendar.html', 'calendar', '📅', 'Calendar']];
    document.getElementById('nav').innerHTML =
      '<div class="logo"><i>⚔</i><span>Focus Quest</span></div><div class="links">' +
      items.map(x => `<a class="${x[1] === active ? 'on' : ''}" href="${x[0]}${KEEP}"><em>${x[2]}</em><span>${x[3]}</span></a>`).join('') +
      '<a href="#" id="lo"><em>🚪</em><span>Log out</span></a></div>' +
      `<div class="me"><div class="av">${esc(me.name[0])}</div><div><b>${esc(me.name)}</b><small>${DEMO ? 'Demo' : 'Signed in'}</small></div></div>`;
    document.getElementById('lo').onclick = e => { e.preventDefault(); logout() };
  }
  const dayNo = () => Math.min(Math.max(1, ALLDAYS.indexOf(TODAY) + 1), ALLDAYS.length);
  const daysLeft = () => Math.max(0, Math.round((new Date(C.END + 'T00:00:00Z') - new Date(TODAY + 'T00:00:00Z')) / 864e5));
  window.FQ = { C, DEMO, UI, KEEP, TODAY, P, ALLDAYS, mode, dayPts, calc, esc, guard, fetchLogs, saveLog, login, logout, nav, dayNo, daysLeft, addDays };
})();
