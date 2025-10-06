//Real-Time
function startPresence() {
  channel = sb.channel("online-users", {
    config: { presence: { key: CURRENT_USER.id } },
  });

  channel.on("presence", { event: "sync" }, () => {
    presenceState = channel.presenceState();
    getInfo();
    getUnreadPreview(CURRENT_USER.id).then((p) => {
      showMessage(p);
    });
  });
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.track({
        user_id: CURRENT_USER.id,
        email: CURRENT_USER.email,
        last_seen: new Date().toISOString(),
      });
    }
  });
}

// Brauzer yopilganda untrack
window.addEventListener("beforeunload", () => {
  if (channel) {
    channel.untrack();
    channel.unsubscribe();
  }
});

// Show Alert
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

// Get New Messages For Users
async function getUnreadPreview(id) {
  const { data, error } = await sb
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      sender:sender_id ( id, first_name, last_name, role, avatar_url )
    `
    )
    .eq("receiver_id", id) // faqat menga kelgan
    .eq("is_read", false) // o‘qilmaganlar
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
async function showMessage(data) {
  const messagesBox = $("messagesBox");
  messagesBox.innerHTML = "";
  $("messagesCount").textContent = `${data.length} Yangi Xabar`;
  if (!data.length) {
    $("messagesAlert").classList.remove("bg-warning");
    messagesBox.innerHTML = `
    <a class="dropdown-item preview-item">
                  <div class="preview-item-content d-flex align-items-start flex-column justify-content-center">
                    <p class="text-gray mb-0"> Hozircha hech Qanday yangi Xabar Yo'q </p>
                  </div>
     </a>
    `;
  } else {
    data.forEach((item) => {
      $("messagesAlert").classList.add("bg-warning");
      messagesBox.innerHTML += `
    <a class="dropdown-item preview-item">
                  <div class="preview-thumbnail">
                    <img src=${
                      item.avatar || "../../assets/images/jpg/user-icon.jpg"
                    } alt="image" class="profile-pic">
                  </div>
                  <div class="preview-item-content d-flex align-items-start flex-column justify-content-center">
                    <h6 class="preview-subject ellipsis mb-1 font-weight-normal">${
                      item.full_name
                    }</h6>
                    <p class="text-gray mb-0"> ${item.last_message} </p>
                  </div>
                </a>
                <div class="dropdown-divider"></div>
    `;
    });
  }
}
let teacherId = null;

async function init() {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    document.getElementById("plansList").innerHTML =
      "<div class='alert alert-warning'>❌ Kirish kerak.</div>";
    return;
  }

  const { data: teacher } = await sb
    .from("teachers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher) {
    document.getElementById("plansList").innerHTML =
      "<div class='alert alert-danger'>❌ Siz teacher emassiz.</div>";
    return;
  }
  teacherId = teacher.id;

  loadPlans();
}

async function loadPlans() {
  const { data, error } = await sb
    .from("work_plans")
    .select(
      `id,name,year,class_id,classes(name),work_plan_teachers(teacher_id)`
    )
    .eq("work_plan_teachers.teacher_id", teacherId);

  const list = document.getElementById("plansList");
  if (error) {
    list.innerHTML =
      "<div class='alert alert-danger'>❌ Xato: " + error.message + "</div>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML =
      "<div class='alert alert-info'>⚠️ Sizga ish reja biriktirilmagan.</div>";
    return;
  }

  list.innerHTML = "";
  data.forEach((pl) => {
    pl.work_plan_teachers.forEach((teach) => {
      if (teach.teacher_id == teacherId) {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";
        col.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h5 class="card-title">${pl.name}</h5>
          <p class="card-text mb-2"><strong>${
            pl.classes?.name || "—"
          } sinf</strong> (${pl.year || ""})</p>
          <button class="btn btn-primary btn-sm" onclick="openPlan('${
            pl.id
          }','${pl.name}','${pl.classes?.name || ""}','${pl.year || ""}')">
            <i class="bi bi-journal-text"></i> Ochish
          </button>
        </div>
      </div>`;
        list.appendChild(col);
      }
    });
  });
}

async function openPlan(planId, name, className, year) {
  const { data, error } = await sb
    .from("work_plans")
    .select(
      `id,name,quarters(id,name,order_num,lessons(id,order_num,topic,hours,schedule_date))`
    )
    .eq("id", planId)
    .maybeSingle();

  if (error || !data) {
    alert("❌ Xato");
    return;
  }

  document.getElementById(
    "modalTitle"
  ).innerText = `${name} — ${className} (${year})`;
  const content = document.getElementById("modalContent");
  content.innerHTML = "";

  (data.quarters || [])
    .sort((a, b) => a.order_num - b.order_num)
    .forEach((q) => {
      const qDiv = document.createElement("div");
      qDiv.className = "mb-4";
      qDiv.innerHTML = `<h6 class="fw-bold border-bottom pb-1 mb-3">${q.name}</h6>`;

      (q.lessons || [])
        .sort((a, b) => a.order_num - b.order_num)
        .forEach((ls) => {
          const lsDiv = document.createElement("div");
          lsDiv.className =
            "d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light";
          lsDiv.innerHTML = `
        <div>
          <strong>${ls.order_num}. ${ls.topic}</strong><br>
          <small class="text-muted">${ls.hours} soat</small>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <input type="date" class="form-control form-control-sm" value="${
            ls.schedule_date ? ls.schedule_date.slice(0, 10) : ""
          }" id="date-${ls.id}" />
          <button class="btn btn-success btn-sm" onclick="saveDate('${
            ls.id
          }')">Saqlash</button>
        </div>`;
          qDiv.appendChild(lsDiv);
        });
      content.appendChild(qDiv);
    });

  const modal = new bootstrap.Modal(document.getElementById("planModal"));
  modal.show();
}

async function saveDate(lessonId) {
  const val = document.getElementById("date-" + lessonId).value;
  const { error } = await sb
    .from("lessons")
    .update({ schedule_date: val })
    .eq("id", lessonId);
  if (error) alert("❌ Xato: " + error.message);
  else alert("✔ Saqlandi");
}

init();
