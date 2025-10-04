//Real-Time
function startPresence() {
     channel = sb.channel('online-users', {
        config: { presence: { key: CURRENT_USER.id } }
      })

      channel.on('presence', { event: 'sync' }, () => {
        presenceState = channel.presenceState()
        getInfo()
       loadNews(CURRENT_USER.id)
       getUnreadPreview(CURRENT_USER.id).then((p)=>{
           showMessage(p);
           });
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



// Get New Messages For Users
 async function getUnreadPreview(id) {
  const { data, error } = await sb
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      sender:sender_id ( id, first_name, last_name, role, avatar_url )
    `)
    .eq("receiver_id",id)  // faqat menga kelgan
    .eq("is_read", false)              // o‘qilmaganlar
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Xato:", error);
    return [];
  }

  // 🔄 Faqat oxirgi 3 ta yuboruvchini olish
  const seenSenders = new Set();
  const result = [];

  for (let msg of data) {
    if (!seenSenders.has(msg.sender.id)) {
      seenSenders.add(msg.sender.id);
      result.push({
        sender_id: msg.sender.id,
        full_name: msg.sender.first_name + " " + msg.sender.last_name,
        role: msg.sender.role,
        avatar: msg.sender.avatar_url,
        last_message: msg.content,
        time: msg.created_at,
      });
    }
    if (result.length === 3) break;
  }

  return result;
}

// Show New Messages
async function showMessage(data){
   const messagesBox = $('messagesBox');
   messagesBox.innerHTML = ''
   $('messagesCount').textContent = `${data.length} Yangi Xabar`;
   if (!data.length) {
    $('messagesAlert').classList.remove('bg-warning')
    messagesBox.innerHTML = `
    <a class="dropdown-item preview-item">
                  <div class="preview-item-content d-flex align-items-start flex-column justify-content-center">
                    <p class="text-gray mb-0"> Hozircha hech Qanday yangi Xabar Yo'q </p>
                  </div>
     </a>
    `;
  }else{
     data.forEach((item)=>{
      $('messagesAlert').classList.add('bg-warning')
      messagesBox.innerHTML +=`
    <a class="dropdown-item preview-item">
                  <div class="preview-thumbnail">
                    <img src=${item.avatar || '../../assets/images/jpg/user-icon.jpg'} alt="image" class="profile-pic">
                  </div>
                  <div class="preview-item-content d-flex align-items-start flex-column justify-content-center">
                    <h6 class="preview-subject ellipsis mb-1 font-weight-normal">${item.full_name}</h6>
                    <p class="text-gray mb-0"> ${item.last_message} </p>
                  </div>
                </a>
                <div class="dropdown-divider"></div>
    `;
  });
  };
};


// Yangiliklarni yuklash
async function loadNews() {
  let { data, error } = await sb
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { showAlert(error.message,'err'); return; }

  const container = document.getElementById("newsList");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `<p class="text-muted">Yangiliklar yo'q</p>`;
    return;
  }

  data.forEach(n => {
  if (n.created_by == CURRENT_USER.id) {
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card card-news h-100">
        ${n.image_url?`<img src="${n.image_url}" class="news-img" alt="...">`:''}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${n.title}</h5>
            <p class="card-text flex-grow-1">${n.description}</p>
            <small class="text-muted">Sana: ${new Date(n.created_at).toLocaleString()}</small>
            <div class="mt-2">
              <button class="btn btn-sm btn-danger" onclick="deleteNews('${n.id}')">O'chirish</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  });
}

// Yangilik qo‘shish
document.getElementById("newsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const type = document.getElementById("type").value;
  const image_url = document.getElementById("image_url").files[0];
  let avatarUrl = await uploadAvatarB(image_url);

  const { error } = await sb.from("news").insert([
    { title, description, image_url:avatarUrl,type, created_by: CURRENT_USER.id }
  ]);

  if (error) return showAlert(error.message,'err');
  showAlert(`${type} Qo'shildi`,'success')
  loader(false)
  closeInfo()
  e.target.reset();
  loadNews();
});

// Yangilikni o‘chirish
async function deleteNews(id) {
  if (!confirm("O‘chirishni xohlaysizmi?")) return;
  const { error } = await sb.from("news").delete().eq("id", id);
  if (error) return alert(error.message);
  loadNews();
}

//Upload Image For Supa Base Bucket "news"
      async function uploadAvatarB(file) {
        if (!file) {
          return null;
        }
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          "https://maktab-backend-six.vercel.app/api/news-upload.js",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        if (data.url) {
          return data.url;
        } else {
          throw new Error(data.error || "Yuklashda xato");
        }
      }

$('showAddNewsForm').addEventListener('click',()=>{
  $('addNewsFormModal').classList.remove('hidden')
  $('wrapCont').classList.add('hidden')
})

$('closeAddNewsForm').addEventListener('click',()=>{
  closeInfo()
})

function closeInfo(){
  $('addNewsFormModal').classList.add('hidden')
  $('wrapCont').classList.remove('hidden')
}


// Boshlash
loadNews();