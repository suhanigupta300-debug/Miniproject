/* SkillSwap frontend – all data lives in the server database (SQLite) */
const $ = id => document.getElementById(id);
const S = { me: null, users: {}, skills: [], reviews: [], requests: [], route: 'home', profileId: null, authMode: 'login' };
let token = localStorage.getItem('ss_token'), lastSnap = '';
const CAT = { Design: ['🎨', 'art-yellow'], Coding: ['💻', 'art-blue'], Communication: ['🎤', 'art-purple'], Creative: ['🎬', 'art-pink'], Other: ['⭐', 'art-orange'] };
const esc = (s = '') => String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const initials = n => n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const user = id => S.users[id] || { id, name: 'Student', avatar: 'ST', department: '', teach: [], rating: 0, reviews: 0 };
const stars = u => u.reviews ? '★ ' + u.rating : 'New';
function toast(m) { const e = $('toast'); e.textContent = m; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 2600) }

let BASE = '';
async function detectBase() {
  try { const r = await fetch('/api/state'); if (r.ok && (r.headers.get('content-type') || '').includes('json')) return }
  catch { }
  BASE = 'http://localhost:3000'; // opened via file:// or Live Server -> talk to the SkillSwap server directly
}
async function api(path, method = 'GET', body) {
  let r;
  try { r = await fetch(BASE + '/api/' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }) }
  catch { throw new Error('Cannot reach the server. Run "node server.js" and open http://localhost:3000') }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
async function act(fn) { try { await fn() } catch (e) { toast(e.message) } }

async function refresh(force) {
  try {
    const d = await api('state'), snap = JSON.stringify(d);
    if (snap === lastSnap && !force) return;
    lastSnap = snap; Object.assign(S, { me: d.me, users: d.users, skills: d.skills, reviews: d.reviews, requests: d.requests });
    if (token && !d.me) { token = null; localStorage.removeItem('ss_token') }
    const a = document.activeElement;
    if (force || !(a && $('app').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) render();
  } catch { }
}

/* ===== routing / render ===== */
function navigate(r) { S.route = r; location.hash = r; render(); scrollTo({ top: 0, behavior: 'smooth' }); $('mainNav').classList.remove('open') }
function toggleMenu() { $('mainNav').classList.toggle('open') }
function render() {
  document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === S.route));
  const views = { home: homeView, explore: exploreView, requests: requestsView, reviews: reviewsView, notifications: notificationsView, dashboard: dashboardView, profile: profileView };
  $('app').innerHTML = (views[S.route] || homeView)();
  const b = $('authBtn');
  if (S.me) { b.textContent = 'My Dashboard'; b.onclick = () => navigate('dashboard') } else { b.textContent = 'Sign in'; b.onclick = () => openAuth() }
  $('logoutBtn').classList.toggle('hidden', !S.me);
  $('notifDot').style.display = S.me && S.requests.some(r => r.to_id === S.me.id && r.status === 'Pending') ? 'block' : 'none';
}
const needLogin = t => `<section class="page"><div class="panel form-page"><h2>${t}</h2><button class="btn btn-primary" onclick="openAuth()">Sign in</button></div></section>`;

/* ===== views ===== */
function homeView() {
  const cta = S.me ? ["navigate('dashboard')", 'Open Dashboard'] : ["openAuth('signup')", 'Create free account'];
  return `<section class="hero"><div><span class="eyebrow">🌱 Campus peer-to-peer learning</span><h1>Exchange skills.<br><em>Build together.</em></h1><p>SkillSwap helps students discover what their peers can teach, offer what they know, schedule learning sessions and build trust through real experiences.</p><div class="hero-actions"><button class="btn btn-primary" onclick="navigate('explore')">Explore Skills →</button><button class="btn btn-light" onclick="${cta[0]}">${cta[1]}</button></div><div class="hero-note"><span>✓ Campus-focused</span><span>✓ Skill exchange</span><span>✓ Reviews & trust</span></div></div>
<div class="hero-visual"><div class="campus-scene"><div class="campus-window"><div class="window-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:auto;color:#7c8882;font-size:12px">SkillSwap</span></div><div class="window-body"><div class="window-title">Campus Skill Exchange</div><div class="searchbar">⌕&nbsp; Search skills <span>Search</span></div><div class="skill-mini-grid">${S.skills.slice(0, 6).map(s => `<div class="mini-card"><div class="mini-art"></div>${esc(s.name)}</div>`).join('') || '<div class="mini-card">Skills added by students appear here</div>'}</div></div></div></div></div></section>
<section class="section alt"><div class="section-head"><div><h2>Everything you need to learn together</h2></div></div><div class="feature-grid"><div class="feature"><div class="feature-icon">🔎</div><h3>Discover skills</h3><p>Search by skill, explore peer profiles and see what they can teach.</p></div><div class="feature"><div class="feature-icon">🤝</div><h3>Exchange & connect</h3><p>Offer a skill in return, then chat or call once your request is accepted.</p></div><div class="feature"><div class="feature-icon">⭐</div><h3>Build trust</h3><p>After an exchange, leave a 1–5 star rating and written review.</p></div></div></section>
<section class="section"><div class="container cta"><div><h2>Have a skill to share?</h2><p>Add it and every student on SkillSwap can find you.</p></div><button class="btn btn-orange" onclick="${S.me ? 'openSkillModal()' : "openAuth('signup')"}">${S.me ? '＋ Add a Skill' : 'Join SkillSwap'}</button></div></section>`;
}

function exploreView() {
  return `<section class="page"><div class="page-title page-title-row"><div><h1>Explore Skills</h1><p>Find students who can teach you something — and discover what you can teach in return.</p></div><button class="btn btn-primary" onclick="openSkillModal()">＋ Add a Skill</button></div><div class="toolbar"><input class="search-input" id="skillSearch" placeholder="⌕  Search skills, people or department..." oninput="filterSkills()">${['All', 'Design', 'Coding', 'Communication', 'Creative', 'Other'].map((t, i) => `<button class="tag ${i ? '' : 'active'}" onclick="filterTag(this,'${t}')">${t}</button>`).join('')}</div><div id="skillGrid" class="skill-grid">${S.skills.length ? skillCards() : `<div class="panel" style="grid-column:1/-1"><h3>No skills listed yet</h3><p class="muted">Be the first — add a skill you can teach.</p></div>`}</div></section>`;
}
function skillCards() {
  return S.skills.map(s => {
    const u = user(s.owner_id), m = CAT[s.category] || CAT.Other;
    return `<article class="skill-card" data-search="${esc((s.name + ' ' + s.description + ' ' + u.name + ' ' + u.department + ' ' + s.category).toLowerCase())}"><div class="skill-art ${m[1]}">${m[0]}</div><div class="skill-content"><h3>${esc(s.name)}</h3><div class="skill-tags"><span class="chip">${esc(s.category)}</span><span class="chip">${esc(s.level)}</span></div><p>${esc(s.description || s.level + ' level ' + s.name + '. Happy to teach and swap.')}</p><div class="person-row"><div class="avatar">${esc(u.avatar)}</div><div class="person-meta"><b>${esc(u.name)}</b><span>${esc(u.department)} · ${stars(u)}</span></div></div><div class="card-actions"><button class="btn btn-light" onclick="loadProfile('${u.id}')">View Profile</button><button class="btn btn-primary" onclick="openRequest('${u.id}','${esc(s.name)}')">Exchange</button></div></div></article>`;
  }).join('');
}
function filterSkills() { const q = ($('skillSearch').value || '').toLowerCase(); document.querySelectorAll('.skill-card').forEach(c => c.style.display = c.dataset.search.includes(q) ? 'block' : 'none') }
function filterTag(btn, tag) { document.querySelectorAll('.tag').forEach(x => x.classList.remove('active')); btn.classList.add('active'); const q = tag === 'All' ? '' : tag.toLowerCase(); document.querySelectorAll('.skill-card').forEach(c => c.style.display = !q || c.dataset.search.includes(q) ? 'block' : 'none') }

function loadProfile(id) { S.profileId = id; navigate('profile') }
function profileView() {
  const u = S.profileId ? user(S.profileId) : S.me;
  if (!u) return needLogin('Sign in to see profiles');
  const skills = S.skills.filter(s => s.owner_id === u.id), revs = S.reviews.filter(r => r.reviewee_id === u.id);
  return `<section class="page"><div class="profile-layout"><aside class="profile-card"><div class="avatar big">${esc(u.avatar)}</div><h2>${esc(u.name)}</h2><p class="muted">${esc(u.department)}</p><div class="stat-row"><div class="stat"><b>${u.reviews ? u.rating : '–'}</b><span>Rating</span></div><div class="stat"><b>${u.reviews}</b><span>Reviews</span></div><div class="stat"><b>${skills.length}</b><span>Skills</span></div></div>${S.me && S.me.id !== u.id ? `<button class="btn btn-primary full" style="margin-top:20px" onclick="openRequest('${u.id}','${esc(skills[0]?.name || '')}')">Send Exchange Request</button>` : ''}</aside><div class="panel"><h2>Can teach</h2>${skills.length ? skills.map(s => `<div class="availability"><b>✓ ${esc(s.name)}</b><span class="muted">${esc(s.category)} · ${esc(s.level)}${s.description ? ' · ' + esc(s.description) : ''}</span></div>`).join('') : '<p class="muted">No skills added yet.</p>'}<h2 style="margin-top:30px">Experience & reviews</h2>${revs.length ? revs.map(reviewMarkup).join('') : '<p class="muted">No reviews yet.</p>'}</div></div></section>`;
}
function reviewMarkup(r) { return `<div class="review"><div class="person-row"><div class="avatar">${initials(r.author)}</div><div class="person-meta"><b>${esc(r.author)}</b><span>${esc(r.skill)} → ${esc(user(r.reviewee_id).name)}</span></div><span style="margin-left:auto" class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span></div><div>${esc(r.text)}</div></div>` }

function commButtons(id) { return `<button class="btn btn-light" onclick="openChat('${id}')">💬 Chat</button><button class="btn btn-light" onclick="startCall('${id}',false)">📞 Voice</button><button class="btn btn-light" onclick="startCall('${id}',true)">🎥 Video</button>` }
function requestCard(r, full) {
  const incoming = r.to_id === S.me.id, o = user(incoming ? r.from_id : r.to_id);
  return `<div class="request-card"><div class="request-info"><div class="avatar">${esc(o.avatar)}</div><div><b>${incoming ? 'From' : 'To'} ${esc(o.name)}</b><div class="muted" style="font-size:13px;margin-top:4px">Wants to learn <b>${esc(r.skill)}</b> · Offers <b>${esc(r.offer)}</b><br>${esc(r.time)}${full && r.message ? ' · ' + esc(r.message) : ''}</div></div></div><div class="request-actions"><span class="status ${r.status === 'Pending' ? 'pending' : r.status === 'Rejected' ? 'rejected' : ''}">${r.status}</span>${incoming && r.status === 'Pending' ? `<button class="btn btn-primary" onclick="updateRequest('${r.id}','Accepted')">Accept</button><button class="btn btn-danger" onclick="updateRequest('${r.id}','Rejected')">Decline</button>` : ''}${r.status === 'Accepted' ? commButtons(r.id) : ''}</div></div>`;
}
function requestsView() {
  if (!S.me) return needLogin('Sign in to view exchange requests.');
  return `<section class="page"><div class="page-title"><h1>Exchange Requests</h1><p>Manage incoming and outgoing skill exchanges. Accepted requests unlock chat, voice and video calls.</p></div><div class="request-list">${S.requests.length ? S.requests.map(r => requestCard(r, true)).join('') : `<div class="panel"><h3>No requests yet</h3><p class="muted">Go to Explore Skills and start an exchange.</p><button class="btn btn-primary" onclick="navigate('explore')">Explore Skills</button></div>`}</div></section>`;
}
function dashboardView() {
  const u = S.me; if (!u) return needLogin('Sign in to open your dashboard');
  const mine = S.skills.filter(s => s.owner_id === u.id);
  return `<section class="page"><div class="page-title"><h1>Hi, ${esc(u.name.split(' ')[0])} 👋</h1><p>Your SkillSwap dashboard.</p></div><div class="profile-layout"><aside class="profile-card"><div class="avatar big">${esc(u.avatar)}</div><h2>${esc(u.name)}</h2><p class="muted">${esc(u.department)}</p><button class="btn btn-light full" onclick="loadProfile('${u.id}')">View My Profile</button><button class="btn btn-primary full" style="margin-top:9px" onclick="navigate('explore')">Find a Skill</button><button class="btn btn-orange full" style="margin-top:9px" onclick="openSkillModal()">＋ Add a Skill</button></aside><div class="panel"><h2>Your exchange activity</h2>${S.requests.length ? S.requests.map(r => requestCard(r)).join('') : `<div class="availability"><b>No exchange requests yet.</b><span class="muted">Explore skills and send your first request.</span></div>`}<div style="margin-top:30px"><div class="section-row"><h2>Your skills</h2><button class="btn btn-primary" onclick="openSkillModal()">＋ Add Skill</button></div>${mine.length ? mine.map(s => `<div class="request-card" style="margin-bottom:10px"><div class="request-info"><div class="avatar">${(CAT[s.category] || CAT.Other)[0]}</div><div><b>${esc(s.name)}</b><div class="muted" style="font-size:13px">${esc(s.category)} · ${esc(s.level)}${s.description ? ' · ' + esc(s.description) : ''}</div></div></div><button class="btn btn-danger" onclick="deleteSkill('${s.id}')">Remove</button></div>`).join('') : `<div class="availability"><b>No skills added yet.</b><span class="muted">Add something you can teach so peers can find you.</span></div>`}</div></div></div></section>`;
}
function reviewsView() {
  const n = S.reviews.length, partners = S.me ? [...new Set(S.requests.filter(r => r.status === 'Accepted').map(r => r.from_id === S.me.id ? r.to_id : r.from_id))] : [];
  return `<section class="page"><div class="page-title"><h1>Experience & Reviews</h1><p>Real learning experiences help future students choose confidently.</p></div><div class="container"><div class="panel" style="margin-bottom:18px"><h2>Community experience</h2><div class="stat-row" style="max-width:500px"><div class="stat"><b>${n}</b><span>Experiences</span></div><div class="stat"><b>${n ? (S.reviews.reduce((a, r) => a + r.stars, 0) / n).toFixed(1) : '–'}</b><span>Average rating</span></div><div class="stat"><b>${S.skills.length}</b><span>Skills listed</span></div></div></div>${S.reviews.map(reviewMarkup).join('')}<div class="panel" style="margin-top:18px"><h2>Share your experience</h2>${!S.me ? `<p class="muted">Sign in to write a review.</p><button class="btn btn-primary" onclick="openAuth()">Sign in</button>` : !partners.length ? `<p class="muted">Once one of your exchange requests is accepted, you can review your partner here.</p>` : `<form onsubmit="addReview(event)"><label>Who did you learn with?</label><select id="revWho">${partners.map(p => `<option value="${p}">${esc(user(p).name)}</option>`).join('')}</select><div class="two-col"><div><label>Skill / exchange</label><input id="revSkill" required placeholder="e.g. Canva"></div><div><label>Rating</label><select id="revStars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div></div><label>Your review</label><textarea id="revText" rows="4" required placeholder="How was the experience?"></textarea><button class="btn btn-primary" type="submit">Post Review</button></form>`}</div></div></section>`;
}
function notificationsView() {
  const items = !S.me ? [] : S.requests.map(r => {
    const inc = r.to_id === S.me.id, o = user(inc ? r.from_id : r.to_id).name;
    if (inc && r.status === 'Pending') return ['🤝 ' + o + ' wants to learn ' + r.skill + ' from you.', 'New'];
    if (!inc && r.status === 'Accepted') return ['✅ ' + o + ' accepted your request. You can chat or call now.', 'Accepted'];
    if (!inc && r.status === 'Rejected') return ['❌ ' + o + ' declined your request.', 'Declined'];
    return null;
  }).filter(Boolean);
  return `<section class="page"><div class="page-title"><h1>Notifications</h1><p>Stay updated about requests and sessions.</p></div><div class="notification-list">${!S.me ? '<div class="notification"><span>Sign in to see your notifications.</span></div>' : items.length ? items.map(i => `<div class="notification"><span>${esc(i[0])}</span><span class="status">${i[1]}</span></div>`).join('') : '<div class="notification"><span>No notifications yet.</span></div>'}</div></section>`;
}

/* ===== actions ===== */
const show = (id, on = true) => $(id).classList.toggle('hidden', !on);
function openSkillModal() { if (!S.me) { toast('Please sign in to add a skill.'); return openAuth('login') } $('skillForm').reset(); show('skillModal'); $('skillName').focus() }
function closeSkillModal() { show('skillModal', false) }
const saveSkill = e => { e.preventDefault(); act(async () => { await api('skills', 'POST', { name: $('skillName').value, category: $('skillCategory').value, level: $('skillLevel').value, description: $('skillDescription').value }); closeSkillModal(); toast('Skill added — everyone can see it now!'); await refresh(true) }) };
const deleteSkill = id => act(async () => { await api('skills/' + id, 'DELETE'); toast('Skill removed.'); await refresh(true) });

function openRequest(uid, skill) {
  if (!S.me) { toast('Please sign in first.'); return openAuth('login') }
  if (uid === S.me.id) return toast('Choose another student for an exchange.');
  $('requestUser').value = uid; $('requestSkill').value = skill || ''; $('requestOffer').value = user(S.me.id).teach[0] || ''; $('requestTime').value = ''; $('requestMessage').value = '';
  $('requestFor').textContent = 'Send a request to ' + user(uid).name + '.'; show('requestModal');
}
function closeRequest() { show('requestModal', false) }
const submitRequest = e => { e.preventDefault(); act(async () => { await api('requests', 'POST', { to: $('requestUser').value, skill: $('requestSkill').value, offer: $('requestOffer').value, time: $('requestTime').value, message: $('requestMessage').value }); closeRequest(); toast('Exchange request sent!'); await refresh(true); navigate('requests') }) };
const updateRequest = (id, status) => act(async () => { await api('requests/' + id, 'PATCH', { status }); toast(status === 'Accepted' ? 'Accepted! You can now chat or call.' : 'Request declined.'); await refresh(true) });
const addReview = e => { e.preventDefault(); act(async () => { await api('reviews', 'POST', { reviewee: $('revWho').value, skill: $('revSkill').value, stars: $('revStars').value, text: $('revText').value }); toast('Review posted.'); await refresh(true) }) };

/* ===== auth ===== */
function openAuth(mode = 'login') {
  S.authMode = mode; show('authModal'); const login = mode === 'login';
  $('authTitle').textContent = login ? 'Welcome back' : 'Create your SkillSwap account';
  $('authSubtitle').textContent = login ? 'Sign in to exchange skills with your campus community.' : 'Create a simple profile and start learning from peers.';
  $('authForm').innerHTML = login
    ? `<form onsubmit="auth(event)"><label>Email</label><input id="email" type="email" required placeholder="you@campus.edu"><label>Password</label><input id="password" type="password" required placeholder="••••••••"><button class="btn btn-primary full" style="margin-top:18px">Sign in</button></form>`
    : `<form onsubmit="auth(event)"><label>Full name</label><input id="name" required placeholder="Your name"><label>Email</label><input id="email" type="email" required placeholder="you@campus.edu"><label>Password</label><input id="password" type="password" minlength="6" required placeholder="At least 6 characters"><label>Department</label><input id="department" required placeholder="B.Sc. Computer Science"><button class="btn btn-primary full" style="margin-top:18px">Create account</button></form>`;
  $('authSwitch').innerHTML = login ? `New here? <button onclick="openAuth('signup')">Create an account</button>` : `Already have an account? <button onclick="openAuth('login')">Sign in</button>`;
}
function closeAuth() { show('authModal', false) }
const auth = e => { e.preventDefault(); act(async () => {
  const login = S.authMode === 'login';
  const d = await api(login ? 'login' : 'signup', 'POST', { email: $('email').value, password: $('password').value, ...(login ? {} : { name: $('name').value, department: $('department').value }) });
  token = d.token; localStorage.setItem('ss_token', token); closeAuth(); await refresh(true);
  toast(login ? 'Welcome back, ' + S.me.name.split(' ')[0] + '!' : 'Account created!'); navigate('dashboard');
}) };
async function logout() { endCall(); closeChat(); try { await api('logout', 'POST') } catch { } token = null; localStorage.removeItem('ss_token'); await refresh(true); toast('You have been signed out.'); navigate('home') }

/* ===== chat ===== */
let chatReq = null, chatCount = -1;
const reqById = id => S.requests.find(r => r.id === id);
const otherOf = r => user(r.from_id === S.me.id ? r.to_id : r.from_id);
function openChat(id) { const r = reqById(id); if (!r || r.status !== 'Accepted') return; chatReq = id; chatCount = -1; $('chatUserName').textContent = otherOf(r).name; $('chatWindow').style.display = 'flex'; renderChat() }
function closeChat() { chatReq = null; $('chatWindow').style.display = 'none' }
async function renderChat() {
  if (!chatReq) return;
  try {
    const { messages } = await api('messages/' + chatReq); if (messages.length === chatCount) return; chatCount = messages.length;
    const box = $('chatMessages');
    box.innerHTML = messages.length ? messages.map(m => `<div class="message ${m.from_id === S.me.id ? 'sent' : 'received'}">${esc(m.text)}</div>`).join('') : '<div class="message received">Request accepted 🎉 Say hi!</div>';
    box.scrollTop = box.scrollHeight;
  } catch { }
}
async function sendMessage() { const i = $('messageInput'), text = i.value.trim(); if (!text || !chatReq) return; i.value = ''; await act(() => api('messages/' + chatReq, 'POST', { text })); renderChat() }

/* ===== voice / video calls (WebRTC, signalling through the server) ===== */
let pc = null, localStream = null, callPeer = null, pendingIce = [];
const sig = (type, to, data = {}) => api('signal', 'POST', { to, body: JSON.stringify({ type, ...data }) }).catch(() => { });
async function getMedia(video) {
  if (!navigator.mediaDevices) { toast('Calls need https:// or http://localhost.'); return false }
  try { localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video }); $('localVideo').srcObject = localStream; $('localVideo').style.display = video ? 'block' : 'none'; return true }
  catch { toast('Could not access ' + (video ? 'camera/microphone' : 'microphone') + '. Check browser permissions.'); return false }
}
function makePc() {
  pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = e => { $('remoteVideo').srcObject = e.streams[0]; $('callType').textContent = 'Connected'; $('callScreen').classList.add('connected') };
  pc.onicecandidate = e => { if (e.candidate) sig('ice', callPeer, { cand: e.candidate }) };
}
function showCall(name, text) { $('callUserName').textContent = name; $('callType').textContent = text; $('callAvatar').textContent = initials(name); $('callScreen').style.display = 'flex' }
function resetCall() {
  if (pc) { pc.close(); pc = null } if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null }
  callPeer = null; pendingIce = []; $('localVideo').srcObject = null; $('remoteVideo').srcObject = null;
  $('callScreen').style.display = 'none'; $('callScreen').classList.remove('connected');
}
async function flushIce() { for (const c of pendingIce.splice(0)) { try { await pc.addIceCandidate(c) } catch { } } }
async function startCall(id, video) {
  const r = reqById(id); if (!r || callPeer) return; const o = otherOf(r); callPeer = o.id;
  if (!(await getMedia(video))) return resetCall();
  showCall(o.name, (video ? 'Video' : 'Voice') + ' calling…'); sig('invite', o.id, { video });
}
function endCall() { if (callPeer) sig('end', callPeer); resetCall() }
function toggleMute(b) { if (!localStream) return; localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled); b.style.opacity = b.style.opacity === '0.5' ? '1' : '0.5' }
function toggleCamera(b) { if (!localStream) return; localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled); b.style.opacity = b.style.opacity === '0.5' ? '1' : '0.5' }
async function onSignal(from, m) {
  if (m.type === 'invite') {
    if (callPeer) return sig('busy', from);
    const c = user(from);
    if (!confirm(`${c.name} is ${m.video ? 'video' : 'voice'} calling you. Answer?`)) return sig('decline', from);
    callPeer = from;
    if (!(await getMedia(m.video))) { sig('decline', from); return resetCall() }
    showCall(c.name, 'Connecting…'); makePc(); sig('accept', from);
  } else if (from !== callPeer) return;
  else if (m.type === 'accept') { makePc(); const o = await pc.createOffer(); await pc.setLocalDescription(o); sig('offer', callPeer, { sdp: o }) }
  else if (m.type === 'offer' && pc) { await pc.setRemoteDescription(m.sdp); await flushIce(); const a = await pc.createAnswer(); await pc.setLocalDescription(a); sig('answer', callPeer, { sdp: a }) }
  else if (m.type === 'answer' && pc) { await pc.setRemoteDescription(m.sdp); await flushIce() }
  else if (m.type === 'ice') { if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(m.cand) } catch { } } else pendingIce.push(m.cand) }
  else if (m.type === 'decline' || m.type === 'busy') { toast(m.type === 'busy' ? 'User is busy.' : 'Call declined.'); resetCall() }
  else if (m.type === 'end') { toast('Call ended.'); resetCall() }
}

/* ===== live updates: poll the server (signals + chat every 1.5s, data every ~4.5s) ===== */
let tick = 0, polling = false;
async function loop() {
  if (polling) return; polling = true;
  try {
    tick++;
    if (S.me) { const { signals } = await api('signals'); for (const s of signals) await onSignal(s.from, JSON.parse(s.body)); if (chatReq) await renderChat() }
    if (tick % 3 === 0) await refresh();
  } catch { }
  polling = false;
}

(async function boot() {
  S.route = location.hash.replace('#', '') || 'home';
  addEventListener('hashchange', () => { S.route = location.hash.replace('#', '') || 'home'; render() });
  await detectBase(); await refresh(true); render(); setInterval(loop, 1500);
})();
