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

// Weekday mapping: Postgres/wanted display (case-insensitive handling)
const weekdays = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];
function weekdayNameFromServerDate(dateObj) {
  if (!(dateObj instanceof Date)) {
    dateObj = new Date(dateObj);
  }
  // dateObj is JS Date
  return weekdays[dateObj.getDay()]; // 0 -> yakshanba
}
function parseTimeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(":");
  const hh = parseInt(parts[0], 10) || 0;
  const mm = parseInt(parts[1], 10) || 0;
  return hh * 60 + mm;
}
function minutesToHourMin(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

/* ====== State ====== */
let currentTeacherId = null;
let currentTeacherLabel = "";
let teacherListCache = [];

/* ====== Server time helper (RPC) ====== */
// Uzbekistan vaqtini olish helper
function getUzbekistanTime() {
  const now = new Date();
  const options = {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("uz-UZ", options).formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour").value, 10);
  const mm = parseInt(parts.find((p) => p.type === "minute").value, 10);
  return { hh, mm, minutes: hh * 60 + mm };
}

function getServerTimeUz() {
  const now = new Date();

  // Asia/Tashkent vaqtida olish
  const formatter = new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // format() → string qaytaradi
  const parts = formatter.formatToParts(now);

  // string bo'lib keladi: ["year","month","day","hour","minute","second"]
  const dateParts = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      dateParts[p.type] = p.value;
    }
  }

  // Date object yasaymiz
  const dateInTashkent = new Date(
    `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}+05:00`
  );

  const hh = dateInTashkent.getHours();
  const mm = dateInTashkent.getMinutes();

  return {
    hh,
    mm,
    minutes: hh * 60 + mm,
    date: dateInTashkent,
  };
}

/*
async function getServerTimeUz(){
  try{
    // RPC must be created in your DB: get_uzb_time() returns timestamptz in Asia/Tashkent
    const { data, error } = await sb.rpc('get_uzb_time');
    if(error){
      console.warn('RPC get_uzb_time error', error);
      // fallback: use server now via direct query
      const q = await sb.from('').select().limit(1);
      return new Date(); // fallback to local if nothing else
    }
    // data is timestamptz string — convert to Date
    return new Date(data);
  }catch(e){
    console.error('getServerTimeUz err', e);
    return new Date();
  }
}
*/
/* ====== Init: detect auth user & load teachers ====== */
(async function init() {
  try {
    const { data } = await sb.auth.getUser();
    if (data && data.user) {
      const uid = data.user.id;
      // try teachers table (if you use teachers linked to profiles)
      const { data: tdata, error } = await sb
        .from("teachers")
        .select("id, user_id, profiles(first_name,last_name)")
        .eq("user_id", uid)
        .maybeSingle();
      if (!error && tdata) {
        currentTeacherId = tdata.id;
        currentTeacherLabel =
          (tdata.profiles?.first_name || "") +
          " " +
          (tdata.profiles?.last_name || "");
      }
    }
  } catch (e) {
    console.warn("auth check error", e);
  }

  await loadTeachers();

  // if not auto-detected, pick first teacher
  if (!currentTeacherId && teacherListCache.length > 0) {
    currentTeacherId = teacherListCache[0].id;
    currentTeacherLabel = teacherListCache[0].label;
    $("teacherSelect").value = currentTeacherId;
  } else if (currentTeacherId) {
    $("teacherSelect").value = currentTeacherId;
  }

  // events
  $("teacherSelect").addEventListener("change", async (e) => {
    currentTeacherId = e.target.value;
    const t = teacherListCache.find((x) => x.id === currentTeacherId);
    currentTeacherLabel = t ? t.label : "";
    await refreshAll();
  });
  $("refreshBtn").addEventListener("click", refreshAll);
  $("viewFullSchedule").addEventListener("click", openFullScheduleModal);

  // initial load
  await refreshAll();

  // periodic update using server time every 30s (keeps "current" in sync)
  setInterval(refreshAll, 30_000);
})();

/* ====== Load teachers for selector ====== */
async function loadTeachers() {
  let teachers = [];
  try {
    const { data, error } = await sb
      .from("teachers")
      .select("id, user_id, profiles(first_name,last_name)")
      .order("id");
    if (!error && data && data.length > 0) {
      teachers = data.map((t) => ({
        id: t.id,
        label:
          (t.profiles?.first_name || "") + " " + (t.profiles?.last_name || ""),
      }));
    }
  } catch (e) {
    console.warn("teachers fetch 1", e);
  }

  if (teachers.length === 0) {
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "teacher")
        .order("first_name");
      if (!error && data)
        teachers = data.map((p) => ({
          id: p.id,
          label: (p.first_name || "") + " " + (p.last_name || ""),
        }));
    } catch (e) {
      console.warn("teachers fetch 2", e);
    }
  }

  teacherListCache = teachers;
  const sel = $("teacherSelect");
  sel.innerHTML = '<option value="">— O\'qituvchini tanlang —</option>';
  teachers.forEach((t) => sel.add(new Option(t.label, t.id)));
}

/* ====== Refresh all (main entry) ====== */
async function refreshAll() {
  if (!currentTeacherId) return;
  // get server time (Uzbek)
  const serverDate = await getServerTimeUz().date;
  // display server time for debugging
  $(
    "serverTimeDisplay"
  ).innerText = `Server (Toshkent): ${serverDate.toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;

  await loadTodaySchedulesForTeacher(currentTeacherId, serverDate);
}

/* ====== Load today's schedules for teacher (uses serverDate) ====== */
async function loadTodaySchedulesForTeacher(teacherId, serverDate) {
  // serverDate is JS Date in Asia/Tashkent timezone returned by RPC
  const weekday = weekdayNameFromServerDate(serverDate); // 'dushanba' etc

  // Query schedule_lessons rows for that teacher & day
  // Expect schedule_lessons to have: id, day (text like 'dushanba'), subject, start_time, end_time, teacher_id, schedules (relation) -> classes(name,id)
  const { data, error } = await sb
    .from("schedule_lessons")
    .select(
      "id, day, subject, start_time, end_time, teacher_id, schedules(classes(name,id))"
    )
    .eq("day", weekday)
    .eq("teacher_id", teacherId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("schedule fetch error", error);
    $(
      "todayList"
    ).innerHTML = `<div class="text-danger">Jadvalni yuklashda xatolik: ${error.message}</div>`;
    $("todayCount").innerText = "0";
    $("todayHours").innerText = "0h 0m";
    $("currentClass").innerText = "—";
    $("currentTopic").innerText = "Ish reja topilmadi";
    return;
  }

  const lessons = Array.isArray(data) ? data : [];

  // compute totals
  let totalMinutes = 0;
  for (const l of lessons) {
    const sMin = parseTimeToMinutes(
      (l.start_time || "").toString().slice(0, 5)
    );
    const eMin = parseTimeToMinutes((l.end_time || "").toString().slice(0, 5));
    if (eMin >= sMin) totalMinutes += eMin - sMin;
  }

  $("todayCount").innerText = lessons.length;
  $("todayHours").innerText = minutesToHourMin(totalMinutes);

  // render list
  const list = $("todayList");
  list.innerHTML = "";
  if (lessons.length === 0) {
    list.innerHTML = '<div class="text-muted">Bugun dars yo‘q</div>';
    $("currentClass").innerText = "—";
    $("currentTimeRange").innerText = "";
    $("currentTopic").innerText = "Ish reja topilmadi";
    $("topicSource").innerText = "";
    return;
  }

  // compute now minutes using serverDate (so user's device time ignored)
  const { minutes: nowMin } = getUzbekistanTime();

  // find first lesson where now in [start,end]
  let currentLesson = null;

  for (const l of lessons) {
    const s = parseTimeToMinutes((l.start_time || "").toString().slice(0, 5));
    const e = parseTimeToMinutes((l.end_time || "").toString().slice(0, 5));

    // append DOM row
    const div = document.createElement("div");
    div.className =
      "lesson-row d-flex justify-content-between text-align-center card-start card";
    const className =
      l.schedules && l.schedules.classes && l.schedules.classes.name
        ? l.schedules.classes.name
        : "—";
    div.innerHTML = `
      <div>
        <div style="font-weight:600">${className} — ${l.subject || "—"}</div>
        <div class="lesson-sub">${(l.start_time || "")
          .toString()
          .slice(0, 5)} — ${(l.end_time || "").toString().slice(0, 5)}${
      l.lesson_number ? " • Dars №" + l.lesson_number : ""
    }</div>
      </div>
      <div class="text-end">
        <div class="tag">${l.day}</div>
      </div>
    `;
    list.appendChild(div);

    // only assign currentLesson if now is inside its interval, and we haven't set currentLesson yet
    if (
      currentLesson === null &&
      s !== null &&
      e !== null &&
      nowMin >= s &&
      nowMin <= e
    ) {
      currentLesson = l;
    }
  }

  // set current UI
  if (currentLesson) {
    const className =
      currentLesson.schedules &&
      currentLesson.schedules.classes &&
      currentLesson.schedules.classes.name
        ? currentLesson.schedules.classes.name
        : "—";
    $("currentClass").innerText = className;
    $("currentTimeRange").innerText = `${(currentLesson.start_time || "")
      .toString()
      .slice(0, 5)} — ${(currentLesson.end_time || "").toString().slice(0, 5)}`;
    // get topic from work plans (classId)
    const classId = currentLesson.schedules?.classes?.id || null;
    if (classId) await findCurrentTopicForClassAndTeacher(classId, teacherId);
  } else {
    $("currentClass").innerText = "Hozir dars yo‘q";
    $("currentTimeRange").innerText = "";
    $("currentTopic").innerText = "Ish reja topilmadi";
    $("topicSource").innerText = "";
  }
}

/* ====== Find current topic from work plans ====== */
async function findCurrentTopicForClassAndTeacher(classId, teacherId) {
  try {
    const { data, error } = await sb
      .from("work_plans")
      .select(
        `
        id, name, year, created_at,
        work_plan_teachers ( teacher_id ),
        quarters ( id, name, order_num, lessons ( id, order_num, topic, schedule_date ) )
      `
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("work_plans fetch err", error);
      $("currentTopic").innerText = "Ish reja topilmadi";
      $("topicSource").innerText = "";
      return;
    }
    if (!data || data.length === 0) {
      $("currentTopic").innerText = "Ish reja topilmadi";
      $("topicSource").innerText = "";
      return;
    }

    // choose first work_plan that includes this teacher (prefer)
    let chosen = null;
    for (const wp of data) {
      const ids = (wp.work_plan_teachers || []).map((x) => x.teacher_id);
      if (ids.includes(teacherId)) {
        chosen = wp;
        break;
      }
    }
    if (!chosen) chosen = data[0];

    // pick first quarter by order_num, then first lesson by order_num
    const quarters = (chosen.quarters || [])
      .slice()
      .sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
    if (quarters.length === 0) {
      $("currentTopic").innerText = "Ish rejada choraklar yo‘q";
      $("topicSource").innerText = chosen.name ? `Reja: ${chosen.name}` : "";
      return;
    }
    const firstQuarter = quarters[0];
    const lessons = (firstQuarter.lessons || [])
      .slice()
      .sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
    if (lessons.length === 0) {
      $("currentTopic").innerText = "Ish rejada darslar yo‘q";
      $("topicSource").innerText = chosen.name ? `Reja: ${chosen.name}` : "";
      return;
    }
    const firstLesson = lessons[0];
    $("currentTopic").innerText = firstLesson.topic || "Mavzu topilmadi";
    $("topicSource").innerText = chosen.name ? `Reja: ${chosen.name}` : "";
  } catch (e) {
    console.error("findCurrentTopic err", e);
    $("currentTopic").innerText = "Ish reja topilmadi";
    $("topicSource").innerText = "";
  }
}

/* ====== Modal: full schedule ====== */
async function openFullScheduleModal() {
  if (!currentTeacherId) return alert("Iltimos o'qituvchini tanlang");
  const { data, error } = await sb
    .from("schedule_lessons")
    .select(
      "id, day, subject, start_time, end_time, teacher_id, schedules(classes(name,id))"
    )
    .eq("teacher_id", currentTeacherId)
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const body = $("modalScheduleBody");
  $("modalTeacherName").innerText = currentTeacherLabel || currentTeacherId;
  body.innerHTML = "";
  if (!data || data.length === 0) {
    body.innerHTML = '<div class="text-muted p-3">Jadval topilmadi</div>';
  } else {
    // group by day preserving weekday order
    const order = weekdays;
    const groups = {};
    for (const r of data) {
      groups[r.day] = groups[r.day] || [];
      groups[r.day].push(r);
    }
    for (const wd of order) {
      if (!groups[wd]) continue;
      const card = document.createElement("div");
      card.className = "mb-3";
      card.innerHTML = `<h6 class="mb-2 text-capitalize">${wd}</h6>`;
      groups[wd].forEach((s) => {
        const el = document.createElement("div");
        el.className =
          "lesson-row d-flex justify-content-between align-items-center";
        const className = s.schedules?.classes?.name || "—";
        el.innerHTML = `<div><strong>${className}</strong> — ${
          s.subject || ""
        } <div class="lesson-sub">${(s.start_time || "")
          .toString()
          .slice(0, 5)} - ${(s.end_time || "")
          .toString()
          .slice(0, 5)}</div></div>`;
        card.appendChild(el);
      });
      body.appendChild(card);
    }
  }

  const modal = new bootstrap.Modal(
    document.getElementById("fullScheduleModal")
  );
  modal.show();
}
