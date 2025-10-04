// Real-Time
function startPresence() {
  channel = sb.channel("online-users", {
    config: { presence: { key: CURRENT_USER.id } },
  });

  channel.on("presence", { event: "sync" }, () => {
    presenceState = channel.presenceState();
    getRax();
    getInfo();
    getCounts();
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

// Get School Big Users
async function getRax() {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["manager"]);

  if (error) {
    showAlert(error.message, "err");
    return;
  }

  const onlineIds = Object.keys(presenceState);

  const raxContainer = $("raxContainer");
  raxContainer.innerHTML = "";
  data.forEach((user, i) => {
    const isOnline = onlineIds.includes(user.id);
    raxContainer.innerHTML += `
    <tr>                    <td>${i + 1}</td>
                            <td>
                              <img src="${
                                user.avatar_url ||
                                "assets/images/jpg/user-icon.jpg"
                              }" class="me-2" alt="image">${
      [user.first_name || "", user.last_name || ""].join(" ").trim() ||
      user.login
    }
                            </td>
                            <td> ${user.position || "-"} </td>
                            <td>
                              <label class="badge ${
                                isOnline
                                  ? "badge-gradient-success"
                                  : "badge-gradient-danger"
                              }">${isOnline ? "Onlayn" : "Oflayn"}</label>
                            </td>
                            <td> ${user.email || "-"} </td>
                            <td> ${user.phone || "-"} </td>
                          </tr>
    <tr>
    `;
  });
}

// Get School Statistica
async function getCounts() {
  // 1) Umumiy foydalanuvchilar soni
  const { count: managerCount, error: err1 } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "manager");

  // 2) O‘qituvchilar soni
  const { count: teachersCount, error: err2 } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  const { count: libraryCount, error: err4 } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "library");

  // 3) O‘quvchilar soni
  const { count: studentsCount, error: err3 } = await sb
    .from("students")
    .select("*", { count: "exact", head: true });

  if (err1 || err2 || err3) {
    showAlert(
      err1.message || err2.message || err3.message || err4.message,
      "err"
    );
    return;
  }
  let totalUser = managerCount + teachersCount + libraryCount;
  const infoContainer = $("infoContainer");
  infoContainer.innerHTML = `
  <div class="col-md-4 stretch-card grid-margin">
                <div class="card bg-gradient-danger card-img-holder text-white">
                  <div class="card-body">
                    <img src="assets/images/dashboard/circle.svg" class="card-img-absolute" alt="circle-image" />
                    <h4 class="font-weight-normal mb-3">Umumiy Hodimlar <i class="fa fa-address-card mdi-24px float-end"></i>
                    </h4>
                    <h2 class="mb-5">${totalUser}</h2>
                  </div>
                </div>
              </div>
              <div class="col-md-4 stretch-card grid-margin">
                <div class="card bg-gradient-info card-img-holder text-white">
                  <div class="card-body">
                    <img src="assets/images/dashboard/circle.svg" class="card-img-absolute" alt="circle-image" />
                    <h4 class="font-weight-normal mb-3">O'quvchilar <i class="fa fa-users mdi-24px float-end"></i>
                    </h4>
                    <h2 class="mb-5">${studentsCount}</h2>
                  </div>
                </div>
              </div>
              <div class="col-md-4 stretch-card grid-margin">
                <div class="card bg-gradient-success card-img-holder text-white">
                  <div class="card-body">
                    <img src="assets/images/dashboard/circle.svg" class="card-img-absolute" alt="circle-image" />
                    <h4 class="font-weight-normal mb-3">O'qituvchilar <i class="fa fa-address-book mdi-24px float-end"></i>
                    </h4>
                    <h2 class="mb-5">${teachersCount}</h2>
                  </div>
                </div>
              </div>
  `;
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
                      item.avatar || "assets/images/jpg/user-icon.jpg"
                    } alt="image" class="profile-pic">
                  </div>
                  <div class="preview-item-content d-flex align-items-start flex-column justify-content-center">
                    <h6 class="preview-subject ellipsis mb-1 font-weight-normal">${
                      item.full_name || "Nomalum"
                    }</h6>
                    <p class="text-gray mb-0"> ${
                      item.last_message || "Yangi Xabar"
                    } </p>
                  </div>
                </a>
                <div class="dropdown-divider"></div>
    `;
    });
  }
}

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
  return `${h} soat ${m} minut`;
}

/* ====== State ====== */
let currentTeacherId = null;
//let currentTeacherLabel = '';
//let teacherListCache = [];

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
async function init() {
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
      }
    }
  } catch (e) {
    console.warn("auth check error", e);
  }

  // events
  $("refreshBtn").addEventListener("click", refreshAll);

  // initial load
  await refreshAll();

  // periodic update using server time every 30s (keeps "current" in sync)
  setInterval(refreshAll, 30_000);
}

/* ====== Refresh all (main entry) ====== */
async function refreshAll() {
  if (!currentTeacherId) return;
  // get server time (Uzbek)
  const serverDate = await getServerTimeUz().date;

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

  $("todayCount").innerText = `${lessons.length} ta Dars`;
  $("todayHours").innerText = minutesToHourMin(totalMinutes);
  // render list
  const list = $("todayList");
  list.innerHTML = "";
  if (lessons.length === 0) {
    list.innerHTML = '<div class="text-muted">Bugun dars yo‘q</div>';
    $("currentClass").innerText = "Hozirda dars Yo'q";
    $("currentTimeRange").innerText = "";
    $("currentTopic").innerText = "Hozirda Mavzu Yo'q";
    $("topicSource").innerText = "";
    return;
  }

  // compute now minutes using serverDate (so user's device time ignored)
  const { minutes: nowMin } = getUzbekistanTime();

  // find first lesson where now in [start,end]
  let currentLesson = null;

  for (const [i, l] of (lessons || []).entries()) {
    const s = parseTimeToMinutes((l.start_time || "").toString().slice(0, 5));
    const e = parseTimeToMinutes((l.end_time || "").toString().slice(0, 5));

    // append DOM row
    const div = document.createElement("tr");
    const className =
      l.schedules && l.schedules.classes && l.schedules.classes.name
        ? l.schedules.classes.name
        : "—";
    div.innerHTML = `
    <td>${i + 1}</td>
    <td>${className}</td>
    <td>${l.subject}</td>
    <td>${(l.start_time || "").toString().slice(0, 5)} - ${(l.end_time || "")
      .toString()
      .slice(0, 5)}</td>
    <td>${l.day}</td>
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
      .slice(0, 5)} - ${(currentLesson.end_time || "").toString().slice(0, 5)}`;
    // get topic from work plans (classId)
    const classId = currentLesson.schedules?.classes?.id || null;
    if (classId) await findCurrentTopicForClassAndTeacher(classId, teacherId);
  } else {
    $("currentClass").innerText = "Hozirda dars Yo'q";
    $("currentTimeRange").innerText = "";
    $("currentTopic").innerText = "Hozirda mavzu Yo'q";
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
      $("currentTopic").innerText = "Hozirda mavzu Yo'q";
      $("topicSource").innerText = "";
      return;
    }
    if (!data || data.length === 0) {
      $("currentTopic").innerText = "Hozirda mavzu Yo'q";
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
