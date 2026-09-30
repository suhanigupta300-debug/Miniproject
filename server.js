// SkillSwap server: static files + JSON API + SQLite (built into Node 22, no npm install needed)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const DIR = import.meta.dirname, PUB = path.join(DIR, 'public'), PORT = process.env.PORT || 3000;
fs.mkdirSync(path.join(DIR, 'data'), { recursive: true });
const db = new DatabaseSync(path.join(DIR, 'data', 'skillswap.db'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,pass TEXT,department TEXT,created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT);
CREATE TABLE IF NOT EXISTS skills(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,category TEXT,level TEXT,description TEXT,created INTEGER);
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,from_id TEXT,to_id TEXT,skill TEXT,offer TEXT,time TEXT,message TEXT,status TEXT DEFAULT 'Pending',created INTEGER);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,req_id TEXT,from_id TEXT,text TEXT,t INTEGER);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,author_id TEXT,reviewee_id TEXT,skill TEXT,stars INTEGER,text TEXT,t INTEGER);
CREATE TABLE IF NOT EXISTS signals(id INTEGER PRIMARY KEY AUTOINCREMENT,to_id TEXT,from_id TEXT,body TEXT,t INTEGER);`);

const q = (sql, ...a) => db.prepare(sql).all(...a), one = (sql, ...a) => db.prepare(sql).get(...a), run = (sql, ...a) => db.prepare(sql).run(...a);
const uid = () => crypto.randomUUID().slice(0, 8), now = () => Date.now();
const initials = n => n.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
const hash = p => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(p, s, 32).toString('hex'); };
const verify = (p, h) => { const [s, k] = h.split(':'); return crypto.timingSafeEqual(Buffer.from(k, 'hex'), crypto.scryptSync(p, s, 32)); };
const pub = u => {
  const r = one('SELECT AVG(stars) a,COUNT(*) c FROM reviews WHERE reviewee_id=?', u.id);
  return { id: u.id, name: u.name, department: u.department, avatar: initials(u.name),
    rating: r.c ? +r.a.toFixed(1) : 0, reviews: r.c, teach: q('SELECT name FROM skills WHERE owner_id=?', u.id).map(s => s.name) };
};

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const need = (c, code, msg) => { if (!c) throw new HttpError(code, msg); };
const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);

const routes = {
  'POST /signup': (b) => {
    const name = clean(b.name, 60), email = clean(b.email, 100).toLowerCase(), dep = clean(b.department, 80), pass = String(b.password || '');
    need(name && /^\S+@\S+\.\S+$/.test(email) && dep, 400, 'Please fill in all fields with a valid email.');
    need(pass.length >= 6, 400, 'Password must be at least 6 characters.');
    need(!one('SELECT 1 FROM users WHERE email=?', email), 409, 'Account already exists. Please sign in.');
    const id = uid(); run('INSERT INTO users(id,name,email,pass,department,created) VALUES(?,?,?,?,?,?)', id, name, email, hash(pass), dep, now());
    return session(id);
  },
  'POST /login': (b) => {
    const u = one('SELECT * FROM users WHERE email=?', clean(b.email, 100).toLowerCase());
    need(u && verify(String(b.password || ''), u.pass), 401, 'Invalid email or password.');
    return session(u.id);
  },
  'POST /logout': (b, me, token) => { run('DELETE FROM sessions WHERE token=?', token); return { ok: true }; },
  'GET /state': (b, me) => ({
    me: me ? pub(me) : null,
    users: Object.fromEntries(q('SELECT * FROM users').map(u => [u.id, pub(u)])),
    skills: q('SELECT id,owner_id,name,category,level,description FROM skills ORDER BY created DESC'),
    reviews: q('SELECT r.*,u.name author FROM reviews r JOIN users u ON u.id=r.author_id ORDER BY r.id DESC'),
    requests: me ? q('SELECT * FROM requests WHERE from_id=? OR to_id=? ORDER BY created DESC', me.id, me.id) : [],
  }),
  'POST /skills': (b, me) => {
    need(me, 401, 'Please sign in.');
    const name = clean(b.name, 60), category = clean(b.category, 30), level = clean(b.level, 30);
    need(name && category && level, 400, 'Please fill in name, category and level.');
    need(!one('SELECT 1 FROM skills WHERE owner_id=? AND lower(name)=lower(?)', me.id, name), 409, 'You already teach that skill.');
    run('INSERT INTO skills VALUES(?,?,?,?,?,?,?)', uid(), me.id, name, category, level, clean(b.description, 300), now());
    return { ok: true };
  },
  'DELETE /skills/:id': (b, me, t, p) => {
    need(me, 401, 'Please sign in.');
    run('DELETE FROM skills WHERE id=? AND owner_id=?', p.id, me.id); return { ok: true };
  },
  'POST /requests': (b, me) => {
    need(me, 401, 'Please sign in.');
    need(b.to !== me.id && one('SELECT 1 FROM users WHERE id=?', b.to), 400, 'Choose another student.');
    const skill = clean(b.skill, 80), offer = clean(b.offer, 80), time = clean(b.time, 80);
    need(skill && offer && time, 400, 'Please fill in all fields.');
    run('INSERT INTO requests VALUES(?,?,?,?,?,?,?,?,?)', uid(), me.id, b.to, skill, offer, time, clean(b.message, 500), 'Pending', now());
    return { ok: true };
  },
  'PATCH /requests/:id': (b, me, t, p) => {
    need(me, 401, 'Please sign in.');
    need(['Accepted', 'Rejected'].includes(b.status), 400, 'Bad status.');
    const r = run("UPDATE requests SET status=? WHERE id=? AND to_id=? AND status='Pending'", b.status, p.id, me.id);
    need(r.changes, 404, 'Request not found.'); return { ok: true };
  },
  'GET /messages/:id': (b, me, t, p) => { chatAccess(me, p.id); return { messages: q('SELECT from_id,text,t FROM messages WHERE req_id=? ORDER BY id', p.id) }; },
  'POST /messages/:id': (b, me, t, p) => {
    chatAccess(me, p.id); const text = clean(b.text, 1000); need(text, 400, 'Empty message.');
    run('INSERT INTO messages(req_id,from_id,text,t) VALUES(?,?,?,?)', p.id, me.id, text, now()); return { ok: true };
  },
  'POST /reviews': (b, me) => {
    need(me, 401, 'Please sign in.');
    const stars = Math.min(5, Math.max(1, +b.stars | 0)), text = clean(b.text, 600), skill = clean(b.skill, 80);
    need(text && skill, 400, 'Please fill in all fields.');
    need(one("SELECT 1 FROM requests WHERE status='Accepted' AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))", me.id, b.reviewee, b.reviewee, me.id), 403, 'You can only review people you exchanged with.');
    run('INSERT INTO reviews(author_id,reviewee_id,skill,stars,text,t) VALUES(?,?,?,?,?,?)', me.id, b.reviewee, skill, stars, text, now()); return { ok: true };
  },
  // WebRTC signalling for voice/video calls
  'POST /signal': (b, me) => {
    need(me, 401, 'Please sign in.');
    need(one("SELECT 1 FROM requests WHERE status='Accepted' AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))", me.id, b.to, b.to, me.id), 403, 'No accepted exchange with this user.');
    run('INSERT INTO signals(to_id,from_id,body,t) VALUES(?,?,?,?)', b.to, me.id, String(b.body).slice(0, 20000), now()); return { ok: true };
  },
  'GET /signals': (b, me) => {
    need(me, 401, 'Please sign in.');
    run('DELETE FROM signals WHERE t<?', now() - 30000);
    const s = q('SELECT id,from_id "from",body FROM signals WHERE to_id=? ORDER BY id', me.id);
    run('DELETE FROM signals WHERE to_id=?', me.id); return { signals: s };
  },
};
function session(id) { const token = crypto.randomBytes(24).toString('hex'); run('INSERT INTO sessions VALUES(?,?)', token, id); return { token }; }
function chatAccess(me, id) {
  need(me, 401, 'Please sign in.');
  need(one("SELECT 1 FROM requests WHERE id=? AND status='Accepted' AND (from_id=? OR to_id=?)", id, me.id, me.id), 403, 'Chat is available after a request is accepted.');
}
function match(method, url) {
  for (const k of Object.keys(routes)) {
    const [m, pat] = k.split(' '); if (m !== method) continue;
    const a = pat.split('/'), b = url.split('/'); if (a.length !== b.length) continue;
    const params = {}; if (a.every((s, i) => s.startsWith(':') ? (params[s.slice(1)] = decodeURIComponent(b[i]), true) : s === b[i])) return [routes[k], params];
  }
}
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), send = (c, d) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d)); };
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.pathname.startsWith('/api/')) {
    try {
      const m = match(req.method, url.pathname.slice(4)); need(m, 404, 'Not found');
      let raw = ''; for await (const c of req) { raw += c; need(raw.length < 100000, 413, 'Too large'); }
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      const s = token && one('SELECT user_id FROM sessions WHERE token=?', token);
      const me = s ? one('SELECT * FROM users WHERE id=?', s.user_id) : null;
      send(200, m[0](raw ? JSON.parse(raw) : {}, me, token, m[1]));
    } catch (e) { send(e.code || 500, { error: e.code ? e.message : 'Server error' }); if (!e.code) console.error(e); }
    return;
  }
  let f = path.join(PUB, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(PUB, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`SkillSwap running → http://localhost:${PORT}`));
