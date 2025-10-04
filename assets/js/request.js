// Supabase ulash (siz bergan URL va KEY)
const SUPABASE_URL = "https://enkqruajxnolwpuxosfg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVua3FydWFqeG5vbHdwdXhvc2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjUzNTcsImV4cCI6MjA3MzcwMTM1N30.TJ1MkVIrxmqIpaLcJjnoTE1glaZ_u5laXuw0jmsJyfE";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");

function emailFromLogin(login) {
  return `${login}@124maktab.uz`;
}

async function uploadAvatar(file, userId) {
  if (!file) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
  return pub.publicUrl;
}

//Show Alert

function showAlert(text, type) {
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance($("liveToast"));
  if (type == "err") {
    $("liveToast").innerHTML = `
           <div class="toast-header">
             <img src="" class="rounded me-2" alt="">
             <strong class="me-auto">❌Xatolik</strong>
             <small>hozir</small>
             <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
           </div>
           <div class="toast-body">
            ${text}
           </div>
           `;
  } else {
    $("liveToast").innerHTML = `
           <div class="toast-header">
             <img src="" class="rounded me-2" alt="">
             <strong class="me-auto">✅Muvaffaqiyatli</strong>
             <small>hozir</small>
             <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
           </div>
           <div class="toast-body">
            ${text}
           </div>
           `;
  }
  toastBootstrap.show();
}
