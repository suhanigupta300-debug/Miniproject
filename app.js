const demoUsers=[
 {id:'u1',name:'Aarav Mehta',email:'aarav@campus.edu',password:'123456',department:'B.Sc. Computer Science',campus:'Thakur College',avatar:'AM',bio:'Frontend learner who loves turning ideas into clean interfaces.',teach:['Web Development','Figma','HTML/CSS'],learn:['Photography','Public Speaking'],availability:'Weekdays · 5 PM–8 PM',rating:4.9,reviews:24},
 {id:'u2',name:'Isha Shah',email:'isha@campus.edu',password:'123456',department:'B.Com',campus:'Thakur College',avatar:'IS',bio:'Can teach Canva and social media design. Looking to learn Excel.',teach:['Canva','Graphic Design','Social Media'],learn:['Excel','Data Analytics'],availability:'Sat–Sun · 11 AM–4 PM',rating:4.8,reviews:18},
 {id:'u3',name:'Rohan Patil',email:'rohan@campus.edu',password:'123456',department:'B.Sc. IT',campus:'Thakur College',avatar:'RP',bio:'Python enthusiast and beginner coding mentor.',teach:['Python','JavaScript','Git'],learn:['UI/UX','Video Editing'],availability:'Tue/Thu · 6 PM–9 PM',rating:4.7,reviews:15},
 {id:'u4',name:'Neha Verma',email:'neha@campus.edu',password:'123456',department:'B.A. Media',campus:'Thakur College',avatar:'NV',bio:'Photographer and content creator who enjoys helping beginners.',teach:['Photography','Video Editing','Content Creation'],learn:['Web Development'],availability:'Fri–Sun · 3 PM–7 PM',rating:5.0,reviews:12},
 {id:'u5',name:'Kabir Khan',email:'kabir@campus.edu',password:'123456',department:'BMS',campus:'Thakur College',avatar:'KK',bio:'Presentation and communication practice partner.',teach:['Public Speaking','PowerPoint','Interview Skills'],learn:['Python','Excel'],availability:'Mon–Fri · 4 PM–7 PM',rating:4.6,reviews:9},
 {id:'u6',name:'Sana Ali',email:'sana@campus.edu',password:'123456',department:'B.Sc. CS',campus:'Thakur College',avatar:'SA',bio:'Excel and data analytics learner with a practical approach.',teach:['Excel','Data Analytics','SQL'],learn:['Graphic Design','Canva'],availability:'Sat · 2 PM–6 PM',rating:4.9,reviews:21}
];
const skills=[
 ['Web Development','Build websites using HTML, CSS and JavaScript.','u1','💻','art-blue'],['Canva','Design social posts, presentations and simple brand kits.','u2','🎨','art-yellow'],['Python','Learn programming fundamentals and small projects.','u3','🐍','art-green'],['Photography','Phone photography, framing, lighting and editing.','u4','📷','art-pink'],['Public Speaking','Practice confidence, presentations and interviews.','u5','🎤','art-purple'],['Excel & Data','Spreadsheets, formulas, charts and beginner analytics.','u6','📊','art-orange'],['Video Editing','Learn reels, cuts, transitions and storytelling.','u4','🎬','art-blue'],['Figma','Create clean UI wireframes and prototypes.','u1','🖌️','art-green'],['SQL','Learn queries, filtering, joins and databases.','u6','🗃️','art-yellow']
];
const seedReviews = [
  {
    id: 'demo1',
    ownerId: 'u2',
    name: 'Aarav Mehta',
    skill: 'Python',
    stars: 5,
    text: 'Great skill exchange experience!'
  },
  {
    id: 'demo2',
    ownerId: 'u3',
    name: 'Rohan Patil',
    skill: 'Web Development',
    stars: 5,
    text: 'Very helpful and easy to learn.'
  }
];
let state={user:null,authMode:'login',route:'home',reviews:JSON.parse(localStorage.getItem('ss_reviews')||'null')||seedReviews,requests:JSON.parse(localStorage.getItem('ss_requests')||'[]')};
function save(){localStorage.setItem('ss_requests',JSON.stringify(state.requests));localStorage.setItem('ss_reviews',JSON.stringify(state.reviews))}
function currentUser(){return state.user}
function userById(id){return demoUsers.find(u=>u.id===id)}
function initials(name){return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
function escapeHtml(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function navigate(route){state.route=route;location.hash=route;render();window.scrollTo({top:0,behavior:'smooth'});document.getElementById('mainNav').classList.remove('open')}
function toggleMenu(){document.getElementById('mainNav').classList.toggle('open')}
function render(){
 document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===state.route));
 const app=document.getElementById('app');
 const views={home:homeView,explore:exploreView,requests:requestsView,reviews:reviewsView,notifications:notificationsView,dashboard:dashboardView,profile:profileView};
 app.innerHTML=(views[state.route]||homeView)();
 updateAuthButton();
}
function updateAuthButton(){const b=document.getElementById('authBtn');if(state.user){b.textContent='My Dashboard';b.onclick=()=>navigate('dashboard')}else{b.textContent='Sign in';b.onclick=openAuth}}
function homeView(){return `<section class="hero"><div><span class="eyebrow">🌱 Campus peer-to-peer learning</span><h1>Exchange skills.<br><em>Build together.</em></h1><p>SkillSwap helps students discover what their peers can teach, offer what they know, schedule learning sessions and build trust through real experiences.</p><div class="hero-actions"><button class="btn btn-primary" onclick="navigate('explore')">Explore Skills →</button><button class="btn btn-light" onclick="${state.user?"navigate('dashboard')":"openAuth('signup')"}">${state.user?'Open Dashboard':'Create free account'}</button></div><div class="hero-note"><span>✓ Campus-focused</span><span>✓ Skill exchange</span><span>✓ Reviews & trust</span></div></div><div class="hero-visual"><div class="campus-scene"><div class="campus-window"><div class="window-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:auto;color:#7c8882;font-size:12px">SkillSwap</span></div><div class="window-body"><div class="window-title">Campus Skill Exchange</div><div class="searchbar">⌕&nbsp; Search skills <span>Search</span></div><div class="skill-mini-grid">${skills.slice(0,6).map(s=>`<div class="mini-card"><div class="mini-art"></div>${s[0]}</div>`).join('')}</div></div></div></div></div></section>
<section class="section alt"><div class="section-head"><div><h2>Everything you need to learn together</h2><p>Structured around the workflow described in your mini-project report.</p></div></div><div class="feature-grid"><div class="feature"><div class="feature-icon">🔎</div><h3>Discover skills</h3><p>Search by skill, explore peer profiles and see availability before sending a request.</p></div><div class="feature"><div class="feature-icon">🤝</div><h3>Exchange & schedule</h3><p>Offer a skill in return, agree on a time and keep your exchange history organized.</p></div><div class="feature"><div class="feature-icon">⭐</div><h3>Build trust</h3><p>After a completed exchange, leave a structured 1–5 star rating and written review.</p></div></div></section>
<section class="section"><div class="section-head"><div><h2>How SkillSwap works</h2><p>Profile → skills → discovery → exchange → session → review.</p></div></div><div class="steps">${[['01','Create your profile','Add your campus, interests, skills and availability.'],['02','Explore peers','Use skill tags and search to find someone who can help.'],['03','Send an exchange','Tell them what you want to learn and what you can offer.'],['04','Learn & review','Complete the session and share your experience.']].map(x=>`<div class="step"><div class="step-num">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join('')}</div></section>
<section class="section"><div class="container cta"><div><h2>Have a skill to share?</h2><p>Turn your knowledge into a useful campus connection.</p></div><button class="btn btn-orange" onclick="${state.user?'navigate(\'dashboard\')':'openAuth(\'signup\')'}">${state.user?'Go to my profile':'Join SkillSwap'}</button></div></section>`}
function exploreView(){return `<section class="page"><div class="page-title"><h1>Explore Skills</h1><p>Find students who can teach you something — and discover what you can teach in return.</p></div><div class="toolbar"><input class="search-input" id="skillSearch" placeholder="⌕  Search skills, people or department..." oninput="filterSkills()"><button class="tag active" onclick="filterTag(this,'All')">All</button><button class="tag" onclick="filterTag(this,'Design')">Design</button><button class="tag" onclick="filterTag(this,'Coding')">Coding</button><button class="tag" onclick="filterTag(this,'Communication')">Communication</button><button class="tag" onclick="filterTag(this,'Creative')">Creative</button></div><div id="skillGrid" class="skill-grid">${skillCards(skills)}</div></section>`}
function skillCards(list){return list.map(s=>{const u=userById(s[2]);return `<article class="skill-card" data-search="${escapeHtml((s[0]+' '+s[1]+' '+u.name+' '+u.department).toLowerCase())}"><div class="skill-art ${s[4]}">${s[3]}</div><div class="skill-content"><h3>${s[0]}</h3><p>${s[1]}</p><div class="person-row"><div class="avatar">${u.avatar}</div><div class="person-meta"><b>${u.name}</b><span>${u.department} · ★ ${u.rating}</span></div></div><div class="card-actions"><button class="btn btn-light" onclick="navigate('profile');setTimeout(()=>loadProfile('${u.id}'),0)">View Profile</button><button class="btn btn-primary" onclick="openRequest('${u.id}','${escapeHtml(s[0])}')">Exchange</button></div></div></article>`}).join('')}
function filterSkills(){const q=(document.getElementById('skillSearch').value||'').toLowerCase();document.querySelectorAll('.skill-card').forEach(c=>c.style.display=c.dataset.search.includes(q)?'block':'none')}
function filterTag(btn,tag){document.querySelectorAll('.tag').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const q=tag==='All'?'':tag.toLowerCase();document.querySelectorAll('.skill-card').forEach(c=>c.style.display=!q||c.dataset.search.includes(q)?'block':'none')}
function profileView(){const u=state.profileId?userById(state.profileId):(state.user||demoUsers[0]);return profileMarkup(u)}
function loadProfile(id){state.profileId=id;render();}
function profileMarkup(u){return `<section class="page"><div class="profile-layout"><aside class="profile-card"><div class="avatar big">${u.avatar}</div><h2>${u.name}</h2><p class="muted">${u.department}</p><div class="stat-row"><div class="stat"><b>${u.rating}</b><span>Rating</span></div><div class="stat"><b>${u.reviews}</b><span>Reviews</span></div><div class="stat"><b>${u.teach.length}</b><span>Skills</span></div></div><p class="bio">${u.bio}</p><div class="chips">${u.teach.map(x=>`<span class="chip">${x}</span>`).join('')}</div>${state.user&&state.user.id!==u.id?`<button class="btn btn-primary full" style="margin-top:20px" onclick="openRequest('${u.id}','${escapeHtml(u.teach[0])}')">Send Exchange Request</button>`:''}</aside><div class="panel"><h2>About ${u.name.split(' ')[0]}</h2><p class="muted">${u.campus} · Available ${u.availability}</p><div class="two-col"><div><h3>Can teach</h3>${u.teach.map(x=>`<div class="availability"><b>✓ ${x}</b><span class="muted">Ready for peer exchange</span></div>`).join('')}</div><div><h3>Wants to learn</h3>${u.learn.map(x=>`<div class="availability"><b>＋ ${x}</b><span class="muted">Looking for a campus peer</span></div>`).join('')}</div></div><h2 style="margin-top:30px">Experience & reviews</h2>${state.reviews.slice(0,4).map(r=>reviewMarkup(r)).join('')}</div></div></section>`}
function reviewMarkup(r){return `<div class="review"><div class="person-row"><div class="avatar">${r.avatar||initials(r.name)}</div><div class="person-meta"><b>${escapeHtml(r.name)}</b><span>${escapeHtml(r.skill)}</span></div><span style="margin-left:auto" class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span></div><div>${escapeHtml(r.text)}</div></div>`}
function dashboardView(){const u=state.user;if(!u)return `<section class="page"><div class="panel form-page"><h2>Sign in to open your dashboard</h2><button class="btn btn-primary" onclick="openAuth()">Sign in</button></div></section>`;const mine=state.requests.filter(r=>r.from===u.id||r.to===u.id);return `<section class="page"><div class="page-title"><h1>Hi, ${u.name.split(' ')[0]} 👋</h1><p>Your SkillSwap dashboard.</p></div><div class="profile-layout"><aside class="profile-card"><div class="avatar big">${u.avatar}</div><h2>${u.name}</h2><p class="muted">${u.department}</p><button class="btn btn-light full" onclick="navigate('profile')">View My Profile</button><button class="btn btn-primary full" style="margin-top:9px" onclick="navigate('explore')">Find a Skill</button></aside><div class="panel"><h2>Your exchange activity</h2>${mine.length?mine.map(requestMarkup).join(''):`<div class="availability"><b>No exchange requests yet.</b><span class="muted">Explore skills and send your first request.</span></div>`}<h2 style="margin-top:30px">Quick actions</h2><div class="two-col"><button class="btn btn-light" onclick="navigate('explore')">🔎 Explore Skills</button><button class="btn btn-light" onclick="navigate('reviews')">⭐ Write a Review</button></div></div></div></section>`}
function requestMarkup(r){const other=userById(r.from===state.user.id?r.to:r.from)||{name:'Student',avatar:'ST'};return `<div class="request-card"><div class="request-info"><div class="avatar">${other.avatar}</div><div><b>${r.from===state.user.id?'Request to '+other.name:'Request from '+other.name}</b><div class="muted" style="font-size:13px">Learn: ${escapeHtml(r.skill)} · Offer: ${escapeHtml(r.offer)} · ${escapeHtml(r.time)}</div></div></div><span class="status ${r.status==='Pending'?'pending':''}">${r.status}</span></div>`}
function requestsView(){if(!state.user)return `<section class="page"><div class="panel form-page"><h2>Sign in to view exchange requests.</h2><button class="btn btn-primary" onclick="openAuth()">Sign in</button></div></section>`;const all=state.requests.filter(r=>r.from===state.user.id||r.to===state.user.id);return `<section class="page"><div class="page-title"><h1>Exchange Requests</h1><p>Manage incoming and outgoing skill exchanges.</p></div><div class="request-list">${all.length?all.map(r=>{const incoming=r.to===state.user.id;const other=userById(incoming?r.from:r.to);return `<div class="request-card"><div class="request-info"><div class="avatar">${other?.avatar||'ST'}</div><div><b>${incoming?'From':'To'} ${other?.name||'Student'}</b><div class="muted" style="font-size:13px;margin-top:4px">Wants to learn <b>${escapeHtml(r.skill)}</b> · Offers <b>${escapeHtml(r.offer)}</b><br>${escapeHtml(r.time)}${r.message?' · '+escapeHtml(r.message):''}</div></div></div><div class="request-actions"><span class="status ${r.status==='Pending'?'pending':r.status==='Rejected'?'rejected':''}">${r.status}</span>${incoming&&r.status==='Pending'?`<button class="btn btn-primary" onclick="updateRequest('${r.id}','Accepted')">Accept</button><button class="btn btn-danger" onclick="updateRequest('${r.id}','Rejected')">Decline</button>`:''}</div></div>`}).join(''):`<div class="panel"><h3>No requests yet</h3><p class="muted">Go to Explore Skills and start an exchange.</p><button class="btn btn-primary" onclick="navigate('explore')">Explore Skills</button></div>`}</div></section>`}
function reviewsView(){return `<section class="page"><div class="page-title"><h1>Experience & Reviews</h1><p>Real learning experiences help future students choose confidently.</p></div><div class="container"><div class="panel" style="margin-bottom:18px"><h2>Community experience</h2><div class="stat-row" style="max-width:500px"><div class="stat"><b>${state.reviews.length+12}</b><span>Experiences</span></div><div class="stat"><b>4.8</b><span>Average rating</span></div><div class="stat"><b>100%</b><span>Peer focused</span></div></div></div>${state.reviews.map(reviewMarkup).join('')}<div class="panel" style="margin-top:18px"><h2>Share your experience</h2>${state.user?`<form onsubmit="addReview(event)"><div class="two-col"><div><label>Skill / exchange</label><input id="revSkill" required placeholder="e.g. Canva"></div><div><label>Rating</label><select id="revStars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div></div><label>Your review</label><textarea id="revText" rows="4" required placeholder="How was the experience?"></textarea><button class="btn btn-primary" type="submit">Post Review</button></form>`:`<p class="muted">Sign in to write a review after a completed exchange.</p><button class="btn btn-primary" onclick="openAuth()">Sign in</button>`}</div></div></section>`}
function notificationsView(){return `<section class="page"><div class="page-title"><h1>Notifications</h1><p>Stay updated about requests, sessions and reviews.</p></div><div class="notification-list"><div class="notification"><span>🤝 Your exchange requests will appear here.</span><span class="status">Ready</span></div><div class="notification"><span>⭐ Reviews are available after completed exchanges.</span><span class="status">Info</span></div><div class="notification"><span>📅 Remember to confirm a session time with your peer.</span><span class="status">Tip</span></div></div></section>`}
function openRequest(userId,skill){if(!state.user){toast('Please sign in first.');openAuth('login');return}if(userId===state.user.id){toast('Choose another student for an exchange.');return}const u=userById(userId);document.getElementById('requestUser').value=userId;document.getElementById('requestSkill').value=skill||'';document.getElementById('requestOffer').value=state.user.teach[0]||'';document.getElementById('requestTime').value='Saturday, 4:00 PM';document.getElementById('requestMessage').value='';document.getElementById('requestFor').textContent=`Send a request to ${u.name}.`;document.getElementById('requestModal').classList.remove('hidden')}
function closeRequest(){document.getElementById('requestModal').classList.add('hidden')}
function submitRequest(e){e.preventDefault();const r={id:'r'+Date.now(),from:state.user.id,to:document.getElementById('requestUser').value,skill:document.getElementById('requestSkill').value,offer:document.getElementById('requestOffer').value,time:document.getElementById('requestTime').value,message:document.getElementById('requestMessage').value,status:'Pending'};state.requests.push(r);save();closeRequest();toast('Exchange request sent!');navigate('requests')}
function updateRequest(id,status){const r=state.requests.find(x=>x.id===id);if(r){r.status=status;save();toast(`Request ${status.toLowerCase()}.`);render()}}
function addReview(e){e.preventDefault();state.reviews.unshift({name:state.user.name,skill:document.getElementById('revSkill').value,stars:+document.getElementById('revStars').value,text:document.getElementById('revText').value,avatar:state.user.avatar});save();toast('Review posted successfully.');render()}
function openAuth(mode='login'){state.authMode=mode;document.getElementById('authModal').classList.remove('hidden');renderAuth()}
function closeAuth(){document.getElementById('authModal').classList.add('hidden')}
function renderAuth(){const login=state.authMode==='login';document.getElementById('authTitle').textContent=login?'Welcome back':'Create your SkillSwap account';document.getElementById('authSubtitle').textContent=login?'Sign in to exchange skills with your campus community.':'Create a simple profile and start learning from peers.';document.getElementById('authForm').innerHTML=login?`<form onsubmit="login(event)"><label>Email</label><input id="email" type="email" required placeholder="you@campus.edu"><label>Password</label><input id="password" type="password" required placeholder="••••••••"><button class="btn btn-primary full" style="margin-top:18px">Sign in</button></form>`:`<form onsubmit="signup(event)"><label>Full name</label><input id="name" required placeholder="Your name"><label>Email</label><input id="email" type="email" required placeholder="you@campus.edu"><label>Password</label><input id="password" type="password" minlength="6" required placeholder="At least 6 characters"><label>Department</label><input id="department" required placeholder="B.Sc. Computer Science"><button class="btn btn-primary full" style="margin-top:18px">Create account</button></form>`;document.getElementById('authSwitch').innerHTML=login?`New here? <button onclick="openAuth('signup')">Create an account</button>`:`Already have an account? <button onclick="openAuth('login')">Sign in</button>`}
function login(e){e.preventDefault();const email=document.getElementById('email').value.toLowerCase(),pass=document.getElementById('password').value;let u=demoUsers.find(x=>x.email.toLowerCase()===email&&x.password===pass);if(!u){toast('Demo login: try aarav@campus.edu / 123456');return}state.user={...u};localStorage.setItem('ss_user',JSON.stringify(state.user));closeAuth();toast('Welcome back, '+u.name.split(' ')[0]+'!');navigate('dashboard')}
function signup(e){e.preventDefault();const name=document.getElementById('name').value,email=document.getElementById('email').value.toLowerCase(),pass=document.getElementById('password').value,department=document.getElementById('department').value;if(demoUsers.some(x=>x.email===email)){toast('Account already exists. Please sign in.');return}const u={id:'u'+Date.now(),name,email,password:pass,department,campus:'Your Campus',avatar:initials(name),bio:'New SkillSwap member — add your skills and interests.',teach:['Add your first skill'],learn:['Add a skill you want to learn'],availability:'Set your availability',rating:0,reviews:0};demoUsers.push(u);state.user={...u};localStorage.setItem('ss_user',JSON.stringify(state.user));closeAuth();toast('Account created!');navigate('dashboard')}
function logout(){state.user=null;localStorage.removeItem('ss_user');toast('You have been signed out.');navigate('home')}
function boot(){try{const u=JSON.parse(localStorage.getItem('ss_user'));if(u)state.user=u}catch{};state.route=location.hash.replace('#','')||'home';window.addEventListener('hashchange',()=>{state.route=location.hash.replace('#','')||'home';render()});render()}
boot();
/* =========================
   SKILLSWAP INTERACTION
========================= */

let connectedUser = {
    name: "SkillSwap User",
    initials: "SU"
};


/* SHOW INTERACTION AFTER ACCEPT */

function showInteraction(userName) {

    connectedUser.name = userName || "SkillSwap User";

    document.getElementById("interactionUserName").textContent =
        connectedUser.name;

    document.getElementById("chatUserName").textContent =
        connectedUser.name;

    document.getElementById("callUserName").textContent =
        connectedUser.name;

    document.querySelector(".user-avatar").textContent =
        getInitials(connectedUser.name);

    document.getElementById("interactionCard").style.display = "block";
}


/* INITIALS */

function getInitials(name) {

    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


/* CHAT */

function openChat() {

    document.getElementById("chatWindow").style.display = "block";

}


function closeChat() {

    document.getElementById("chatWindow").style.display = "none";

}


function sendMessage() {

    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (message === "") return;

    const messageBox = document.getElementById("chatMessages");

    const newMessage = document.createElement("div");

    newMessage.className = "message sent";

    newMessage.textContent = message;

    messageBox.appendChild(newMessage);

    input.value = "";

    messageBox.scrollTop = messageBox.scrollHeight;

}


function handleEnter(event) {

    if (event.key === "Enter") {

        sendMessage();

    }

}


/* VOICE CALL */

function startVoiceCall() {

    document.getElementById("callType").textContent =
        "Voice calling...";

    document.getElementById("callScreen").style.display =
        "flex";

}


/* VIDEO CALL */

function startVideoCall() {

    document.getElementById("callType").textContent =
        "Video calling...";

    document.getElementById("callScreen").style.display =
        "flex";

}


/* END CALL */

function endCall() {

    document.getElementById("callScreen").style.display =
        "none";

}


/* USER PROFILE */

function viewUserProfile() {

    alert(
        "Opening " +
        connectedUser.name +
        "'s profile..."
    );

}
/* =========================
   ADD SKILL SYSTEM
========================= */

let skills = JSON.parse(
    localStorage.getItem("skills") || "[]"
);


/* OPEN MODAL */

function openSkillModal() {

    document.getElementById("skillModal").style.display = "flex";

}


/* CLOSE MODAL */

function closeSkillModal() {

    document.getElementById("skillModal").style.display = "none";

}


/* SAVE SKILL */

function saveSkill() {

    const name =
        document.getElementById("skillName").value.trim();

    const category =
        document.getElementById("skillCategory").value;

    const level =
        document.getElementById("skillLevel").value;

    const description =
        document.getElementById("skillDescription").value.trim();


    if (!name) {
        alert("Please enter a skill name.");
        return;
    }

    if (!category) {
        alert("Please select a category.");
        return;
    }

    if (!level) {
        alert("Please select your skill level.");
        return;
    }


    const skill = {

        id: Date.now(),

        name: name,

        category: category,

        level: level,

        description: description

    };


    skills.push(skill);

    localStorage.setItem(
        "skills",
        JSON.stringify(skills)
    );


    displaySkills();

    closeSkillModal();

    document.getElementById("skillName").value = "";

    document.getElementById("skillCategory").value = "";

    document.getElementById("skillLevel").value = "";

    document.getElementById("skillDescription").value = "";

}


/* DISPLAY SKILLS */

function displaySkills() {

    const container =
        document.getElementById("mySkills");

    const noSkills =
        document.getElementById("noSkills");


    if (!container) return;


    container.innerHTML = "";


    if (skills.length === 0) {

        container.innerHTML =
            '<p class="no-skills">You haven\'t added any skills yet.</p>';

        return;

    }


    skills.forEach(skill => {

        const card =
            document.createElement("div");

        card.className = "skill-item";


        card.innerHTML = `

            <button
                class="delete-skill"
                onclick="deleteSkill(${skill.id})">
                ×
            </button>

            <h3>${skill.name}</h3>

            <span class="skill-category">
                ${skill.category}
            </span>

            <p>
                <strong>Level:</strong>
                ${skill.level}
            </p>

            <p>
                ${skill.description || "No description added."}
            </p>

        `;


        container.appendChild(card);

    });

}


/* DELETE SKILL */

function deleteSkill(id) {

    skills =
        skills.filter(skill => skill.id !== id);

    localStorage.setItem(
        "skills",
        JSON.stringify(skills)
    );

    displaySkills();

}


/* LOAD SKILLS */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        displaySkills();

    }
);
