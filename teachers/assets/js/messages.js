 //Real-Time
function startPresence() {
     channel = sb.channel('online-users', {
        config: { presence: { key: CURRENT_USER.id } }
      })

      channel.on('presence', { event: 'sync' }, () => {
        presenceState = channel.presenceState()
        const openChatId = JSON.parse(localStorage.getItem('openChatId'));
        if (openChatId) {
          userOnline(openChatId)
        }
        init()
      })
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            user_id: CURRENT_USER.id,
            email: CURRENT_USER.email,
            last_seen: new Date().toISOString()
          })
        }
      })
    }



// Brauzer yopilganda untrack
    window.addEventListener('beforeunload', () => {
      if (channel) {
        channel.untrack()
        channel.unsubscribe()
      }
    })


// Show Alert
function showAlert(text,type){
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance($('liveToast'))
  if (type == 'err') {
    $('liveToast').innerHTML = `
    <div class="toast-header">
      <img src="" class="rounded me-2" alt="">
      <strong class="me-auto">❌Xatolik</strong>
      <small>hozir</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
     ${text}
    </div>
    `
  }else{
    $('liveToast').innerHTML = `
    <div class="toast-header">
      <img src="" class="rounded me-2" alt="">
      <strong class="me-auto">✅Muvaffaqiyatli</strong>
      <small>hozir</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
     ${text}
    </div>
    `
  }
toastBootstrap.show()
 

}



/* DOM */
const usersList = document.getElementById('usersList');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');

const rightPanel = document.getElementById('rightPanel');
const backBtn = document.getElementById('backBtn');
const chatName = document.getElementById('chatName');
const chatStatus = document.getElementById('chatStatus');
const chatAvatar = document.getElementById('chatAvatar');
const messagesContainer = document.getElementById('messagesContainer');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const chatExtra = document.getElementById('chatExtra');

const myAvatar = document.getElementById('myAvatar');
const myName = document.getElementById('myName');
const myRole = document.getElementById('myRole');

const sndSend = document.getElementById('sndSend');
const sndRecv = document.getElementById('sndRecv');

let users = [];             // list of profiles
let selectedUser = null;    // {id,...}
let subscription = null;

/* Utilities */
const esc = s => (s===null||s===undefined) ? '' : String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const timeFmt = (iso) => {
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
};

/* ====== ON LOAD: get current user (auth) or fallback choose ====== */
async function init(){
  // if not logged-in or profile not found, let user pick from profiles
  if(!CURRENT_PROFILE){
    // fetch small list and set first one as currentUser (simple fallback)
    const { data: profs, error } = await sb.from('profiles').select('id, first_name, last_name, role, avatar_url').limit(20);
    if(error) return showAlert(error.message,'err');
    if(!profs || profs.length===0) return showAlert('profiles jadvali bo\'sh — admin profil qo\'shing','err');
    // fallback: pick first (in real app use login)
  }
  // show my info
  myAvatar.src = CURRENT_PROFILE.avatar_url || '../assets/images/jpg/user-icon.jpg';
  myName.textContent = (CURRENT_PROFILE.first_name || '') + ' ' + (CURRENT_PROFILE.last_name||'');
  myRole.textContent = CURRENT_PROFILE.role || '';

  // load users and subscribe
  await loadUsers();
  subscribeRealtime();
};

/* ====== Load users (with last message & unread count) ====== */
async function loadUsers(){
  // we'll fetch profiles + compute last message and unread counts per user using RPC via Supabase query
  // select profiles (exclude me) then for each get last message and unread count
  const { data: profs, error } = await sb.from('profiles').select('id, first_name, last_name, role, avatar_url, is_online').neq('id', CURRENT_PROFILE.id).order('first_name');
  if(error){ showAlert(error.message,'err'); return; }
  users = profs || [];

  // For performance, get last messages and unread counts in batch
  const otherIds = users.map(u=>u.id);
  if(otherIds.length===0){ renderUsers(); return; }

  // 1) get last message for each conversation (either direction)
  const { data: lastMsgs } = await sb
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, is_read')
    .in('sender_id', otherIds)
    .or(otherIds.map(id=>`and(sender_id.eq.${CURRENT_PROFILE.id},receiver_id.eq.${id}))`).join(',')) // placeholder, we'll use simpler: fetch where sender or receiver in [me,others]
    .limit(1000);

  // Simpler approach: fetch last message per conversation via SQL view would be ideal.
  // To keep here simple and reliable, we'll fetch last 200 messages involving currentUser and compute per-other
  const { data: recentMsgs, error: rmErr } = await sb
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, is_read')
    .or(`sender_id.eq.${CURRENT_PROFILE.id},receiver_id.eq.${CURRENT_PROFILE.id}`)
    .order('created_at',{ascending:false})
    .limit(400);

  if(rmErr){ showAlert(rmErr.message,'err'); renderUsers(); return; }

  // compute per-other last message & unread counts
  const per = {}; // id -> {last, unread}
  for(const m of (recentMsgs||[])){
    const other = (m.sender_id === CURRENT_PROFILE.id) ? m.receiver_id : m.sender_id;
    if(!other) continue;
    if(!per[other]) per[other] = { last: m, unread:0 };
    if(!per[other].last) per[other].last = m;
    // compute unread when message.receiver_id === currentUser.id and !is_read
    if(m.receiver_id === CURRENT_PROFILE.id && !m.is_read){
      per[other].unread = (per[other].unread || 0) + 1;
    }
    // keep last as the newest (recentMsgs sorted desc)
    if(!per[other].last || new Date(m.created_at) > new Date(per[other].last.created_at)) per[other].last = m;
  }

  // attach to users
  users = users.map(u=>{
    return {
      ...u,
      last: per[u.id] ? per[u.id].last : null,
      unread: per[u.id] ? per[u.id].unread : 0
    };
  });

  renderUsers();
}

/* ====== Render users list ====== */
function renderUsers(filter=''){
  usersList.innerHTML = '';
  const q = String(filter||'').trim().toLowerCase();
  const filtered = users.filter(u => {
    const name = ((u.first_name||'')+' '+(u.last_name||'')).toLowerCase();
    return name.includes(q);
  });
  for(const u of filtered){
    const lastText = u.last ? (u.last.content.length>40 ? u.last.content.slice(0,40)+'...' : u.last.content) : '';
    const time = u.last ? timeFmt(u.last.created_at) : '';
    const item = document.createElement('div');
    item.className = 'user-item';
    item.dataset.id = u.id;
    item.innerHTML = `
      <img class="avatar" src="${esc(u.avatar_url) || '../assets/images/jpg/user-icon.jpg'}" alt="">
      <div class="u-meta">
        <div class="u-name">${esc(u.first_name||'') } ${esc(u.last_name||'')}</div>
        <div class="u-last">${esc(lastText)}</div>
      </div>
      <div class="u-right">
        <div class="time">${time}</div>
        <div style="margin-top:6px">
          ${u.unread>0 ? `<span class="badge-unread">${u.unread}</span>` : (u.last && u.last.sender_id===CURRENT_PROFILE.id ? `<span class="tick small">${u.last.is_read ? '&#10003;&#10003;' : '&#10003;'}</span>` : '')}
        </div>
      </div>
    `;
    item.addEventListener('click', ()=> openChat(u));
    usersList.appendChild(item);
  }
}


async function userOnline(u){
  localStorage.setItem('openChatId',JSON.stringify(u))
  const onlineIds = Object.keys(presenceState)
  const isOnline = onlineIds.includes(u.id)
  chatStatus.textContent = isOnline ? 'online' : 'offline';
}

/* ====== Open chat with user ====== */
async function openChat(u){
  userOnline(u)
  selectedUser = u;
  // show right panel (mobile)
  document.getElementById('leftPanel').classList.add('hidden');
  rightPanel.classList.add('active');
  chatName.textContent = (u.first_name||'') + ' ' + (u.last_name||'');
  chatAvatar.src = u.avatar_url || '../assets/images/jpg/user-icon.jpg';
  messagesContainer.innerHTML = '';
  chatExtra.textContent = '';

  // mark unread -> set is_read true for messages where receiver = currentUser and sender = selectedUser
  await markMessagesRead(u.id);

  // load messages
  await loadMessagesFor(u.id);
}

/* ====== Load messages for conversation ====== */
async function loadMessagesFor(otherId){
  const { data, error } = await sb.from('messages')
    .select('id, sender_id, receiver_id, content, created_at, is_read')
    .or(`and(sender_id.eq.${CURRENT_PROFILE.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${CURRENT_PROFILE.id})`)
    .order('created_at',{ ascending:true })
    .limit(200);
  if(error){ console.error('load messages', error); return; }
  messagesContainer.innerHTML = '';
  for(const m of data) appendMessageToDOM(m, false);
  scrollMessages();
}

/* ====== Append message to DOM ====== */
function appendMessageToDOM(m, playSound=true){
  const row = document.createElement('div');
  row.className = 'msg-row ' + (m.sender_id===CURRENT_PROFILE.id ? 'self' : 'other');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (m.sender_id===CURRENT_PROFILE.id ? 'self' : 'other');
  bubble.innerHTML = esc(m.content) + `<div class="msg-meta">${timeFmt(m.created_at)} ${(m.sender_id===CURRENT_PROFILE.id)? (m.is_read ? '<span class="tick"> &#10003;&#10003;</span>' : '<span class="tick"> &#10003;</span>') : ''}</div>`;
  row.appendChild(bubble);
  messagesContainer.appendChild(row);
  // animate
  bubble.classList.add('animate__animated','animate__fadeInUp');
  // play sound
 /* if(playSound){
    if(m.sender_id===CURRENT_PROFILE.id) sndSend.play().catch(()=>{});
    else sndRecv.play().catch(()=>{});
  }*/
  // keep small messages list cap, scroll
  scrollMessages();
}

/* scroll helper */
function scrollMessages(){
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/* ====== Send message ====== */
sendBtn.addEventListener('click', sendHandler);
msgInput.addEventListener('keydown', (e)=> { if(e.key==='Enter'){ e.preventDefault(); sendHandler(); }});

async function sendHandler(){
  const txt = msgInput.value.trim();
  if(!txt || !selectedUser) return;
  msgInput.value = '';
  try{
    const payload = {
      sender_id: CURRENT_PROFILE.id,
      receiver_id: selectedUser.id,
      content: txt,
      is_read: false
    };
    const { data, error } = await sb.from('messages').insert([payload]).select().single();
    if(error) throw error;
    appendMessageToDOM(data, true);
    // update users list preview/unread quickly (optimistic)
    await loadUsers();
  }catch(err){
    console.error('send err', err);
    alert('Xabar yuborilmadi: '+(err.message||err));
  }
}

/* ====== Mark messages read ====== */
async function markMessagesRead(fromId){
  try{
    const { error } = await sb.from('messages')
      .update({ is_read: true, seen_at: new Date().toISOString() })
      .eq('sender_id', fromId)
      .eq('receiver_id', CURRENT_PROFILE.id)
      .is('is_read', false);
    if(error) console.error('mark read', error);
    // reload users list to update unread counts
    await loadUsers();
  }catch(e){ console.error(e); }
}

/* ====== Real-time subscription ====== */
function subscribeRealtime(){
  // unsubscribe old
  try{ if(subscription) sb.removeChannel(subscription); }catch(e){}
  subscription = sb.channel('realtime-messages')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages' }, payload => {
      const m = payload.new;
      // if message belongs to me and selectedUser, show and mark read if receiver is me
      if(selectedUser && ((m.sender_id===selectedUser.id && m.receiver_id===CURRENT_PROFILE.id) || (m.sender_id===CURRENT_PROFILE.id && m.receiver_id===selectedUser.id))){
        // show
        appendMessageToDOM(m, true);
        // if message targeted to me, mark read (auto)
        if(m.receiver_id === CURRENT_PROFILE.id){
          // optimistic mark read
          sb.from('messages').update({ is_read:true, seen_at: new Date().toISOString() }).eq('id', m.id).then(()=>{});
        }
      }
      // update users list for unread preview/badges
      loadUsers();
    })
    .on('postgres_changes', { event:'UPDATE', schema:'public', table:'messages' }, payload=>{
      // if update contains is_read change we should update tick marks in UI
      const m = payload.new;
      // if displayed in current conversation, update last message tick (simple approach: reload messages)
      if(selectedUser && ((m.sender_id===selectedUser.id && m.receiver_id===CURRENT_PROFILE.id) || (m.sender_id===CURRENT_PROFILE.id && m.receiver_id===selectedUser.id))){
        // refresh conversation messages partially: for simplicity, reload all
        loadMessagesFor(selectedUser.id);
      }
      // reload users preview
      loadUsers();
    })
    .subscribe();
}

/* ====== search & UI handlers ====== */
searchInput.addEventListener('input', ()=> renderUsers(searchInput.value));
refreshBtn.addEventListener('click', ()=> { loadUsers(); });

backBtn.addEventListener('click', ()=>{
  // close chat on mobile
  document.getElementById('leftPanel').classList.remove('hidden');
  rightPanel.classList.remove('active');
});

/* ====== window focus: update online status (optional) ====== */
/* You can implement alive ping to update profiles.is_online if desired.
   Example: sb.from('profiles').update({is_online:true}).eq('id', currentUser.id)
*/

/* ====== Cleanup on unload ====== */
window.addEventListener('beforeunload', ()=> {
  try{ if(subscription) sb.removeChannel(subscription); }catch(e){}
});