// DOM
const plansListEl = document.getElementById("plansList");
const btnNewPlan = document.getElementById("btnNewPlan");
const btnRefresh = document.getElementById("btnRefresh");
const planDetailsCard = document.getElementById("planDetailsCard");
const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailTeachers = document.getElementById("detailTeachers");
const detailQuarters = document.getElementById("detailQuarters");

const formTitle = document.getElementById("formTitle");
const planIdEl = document.getElementById("planId");
const planNameEl = document.getElementById("planName");
const classSelectEl = document.getElementById("classSelect");
const planYearEl = document.getElementById("planYear");
const teachersContainer = document.getElementById("teachersContainer");
const btnAddTeacher = document.getElementById("btnAddTeacher");
const quartersContainer = document.getElementById("quartersContainer");
const btnAddQuarter = document.getElementById("btnAddQuarter");
const btnSavePlan = document.getElementById("btnSavePlan");
const btnCancel = document.getElementById("btnCancel");
const formMsg = document.getElementById("formMsg");
const btnEditPlan = document.getElementById("btnEditPlan");
const btnDeletePlan = document.getElementById("btnDeletePlan");

let allTeachers = [];
let allClasses = [];
let currentPlan = null; // loaded plan data for details
let teacherSelectIdCounter = 0;
let quarterIdCounter = 0;

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
    showAlert(error.message, "err");
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

/* ---------------- init ---------------- */
document.addEventListener("DOMContentLoaded", init);
btnNewPlan.addEventListener("click", () => showFormForNew());
btnRefresh.addEventListener("click", loadPlans);
btnAddTeacher.addEventListener("click", addTeacherSelect);
btnAddQuarter.addEventListener("click", () => addQuarterUI());
btnSavePlan.addEventListener("click", savePlan);
btnCancel.addEventListener("click", () => {
  resetForm();
  closeInfo();
});
btnEditPlan.addEventListener("click", () => {
  showFormForNew();
  if (currentPlan) loadPlanIntoForm(currentPlan.id);
});
btnDeletePlan.addEventListener("click", async () => {
  if (currentPlan) await deletePlanConfirmed(currentPlan.id);
});

function showFormForNew() {
  document.getElementById("wrapCont").classList.add("hidden");
  document.getElementById("planModal").classList.remove("hidden");
}

async function init() {
  loader(true);
  await loadReferenceData();
  await loadPlans();
  resetForm();
  loader(false);
}

/* ------------- load reference (teachers, classes) ------------- */
async function loadReferenceData() {
  const [{ data: teachers, error: teErr }, { data: classes, error: clErr }] =
    await Promise.all([
      sb
        .from("teachers")
        .select("id, profiles(first_name,last_name)")
        .order("user_id"),
      sb.from("classes").select("id, name").order("name"),
    ]);
  if (teErr) {
    showAlert(teErr.message, "err");
    return;
  }
  if (clErr) {
    showAlert(clErr.message, "err");
    return;
  }
  allTeachers = teachers || [];
  allClasses = classes || [];

  // fill classes select
  classSelectEl.innerHTML = allClasses
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");
}

/* ------------- plans list ------------- */
async function loadPlans() {
  loader(true);
  // fetch: include classes and plan teachers (teachers count)
  const { data, error } = await sb
    .from("work_plans")
    .select(
      `
          id, name, year, created_at,
          classes ( id, name ),
          work_plan_teachers ( teacher_id )
        `
    )
    .order("created_at", { ascending: false });

  if (error) {
    showAlert(`${escapeHtml(error.message)}`, "err");
    return;
  }

  loader(false);
  plansListEl.innerHTML = "";
  (data || []).forEach((plan, i) => {
    const teachersCount = Array.isArray(plan.work_plan_teachers)
      ? plan.work_plan_teachers.length
      : 0;
    const div = document.createElement("tr");
    div.innerHTML = `
          <td>${escapeHtml(i + 1)}</td>
          <td>${escapeHtml(plan.name)}</td>
          <td>(${escapeHtml(plan.year)})</td>
          <td>${escapeHtml(plan.classes?.name || "—")}</td>
          <td>${teachersCount}</td>
          <td><button class="btn-ghost" onclick=viewPlanHandler("${
            plan.id
          }")>Ko'rish</button>
              <button class="btn-ghost" onclick=editPlanHandler("${
                plan.id
              }")>Tahrirlash</button></td>
        `;
    plansListEl.appendChild(div);
  });
}

/* ------------- view plan details ------------- */
async function viewPlanHandler(e) {
  const id = e;
  document.getElementById("wrapCont").classList.add("hidden");
  document.getElementById("lessonsModal").classList.remove("hidden");
  await viewPlan(id);
}

async function viewPlan(id) {
  loader(true);
  const { data: plan, error } = await sb
    .from("work_plans")
    .select(
      `
          id, name, year, created_at,
          classes ( id, name ),
          work_plan_teachers ( id, teacher_id, teachers ( profiles(first_name, last_name) ) ),
          quarters ( id, order_num, name,
            lessons ( id, order_num, topic, hours, schedule_date )
          )
        `
    )
    .eq("id", id)
    .single();

  if (error) {
    showAlert(error.message, "err");
    loader(false);
    return;
  }

  currentPlan = plan;
  detailTitle.textContent = `Ish Reja Nomi: ${plan.name};`;
  document.getElementById("workYear").textContent = `O'quv Yili:${plan.year}`;
  detailMeta.textContent = `Sinf:${plan.classes.name}`;
  // teachers list
  detailTeachers.innerHTML = `O'qituvchilar:${
    plan.work_plan_teachers
      .map(
        (wt) =>
          `<p class="page-title">${wt.teachers.profiles.first_name} ${wt.teachers.profiles.last_name}</p>`
      )
      .join(", ") || "—"
  }`;

  // quarters + lessons
  const quarters = (plan.quarters || []).sort(
    (a, b) => a.order_num - b.order_num
  );
  let qHtml = "";
  let dars = "";
  quarters.forEach((q) => {
    const lessons = (q.lessons || []).sort((a, b) => a.order_num - b.order_num);
    if (lessons.length === 0) {
      dars = `<tr><td>Hech qanday dars yo'q</td></tr>`;
    } else {
      lessons.forEach((ls) => {
        dars += `<tr>
              <td>${ls.order_num}</td>
              <td>${escapeHtml(ls.topic)}</td>
              <td>${ls.hours}</td>
              <td>${ls.schedule_date ? escapeHtml(ls.schedule_date) : ""}</td>
            </tr>`;
      });
    }
    qHtml += `
          <div class="col-12 grid-margin">
                <div class="card">
                  <div class="card-body">
                    <h4 class="card-title">${q.order_num}-Chorak</h4>
                    <div class="table-responsive">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Dars №</th>
                            <th>Bo‘lim va mavzu</th>
                            <th>Soat</th>
                            <th>Taqvimiy muddat</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${dars}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>`;
  });
  detailQuarters.innerHTML = qHtml;
  loader(false);
}

/* ------------- edit plan handler (open form with data) ------------- */
async function editPlanHandler(e) {
  showFormForNew();
  const id = e;
  await loadPlanForEdit(id);
}

async function loadPlanIntoForm(id) {
  loader(true);
  const { data: plan, error } = await sb
    .from("work_plans")
    .select(
      `
          id, name, year, class_id,
          work_plan_teachers ( id, teacher_id ),
          quarters ( id, order_num, name,
            lessons ( id, order_num, topic, hours, schedule_date )
          )
        `
    )
    .eq("id", id)
    .single();

  if (error) {
    showAlert(error.message, "err");
    loader(false);
    return;
  }

  // fill form
  planIdEl.value = plan.id;
  planNameEl.value = plan.name;
  planYearEl.value = plan.year;
  classSelectEl.value = plan.class_id;
  // clear teachers UI
  teachersContainer.innerHTML = "";
  teacherSelectIdCounter = 0;
  const teacherIds = (plan.work_plan_teachers || []).map((wt) => wt.teacher_id);
  if (teacherIds.length === 0) addTeacherSelect(); // at least one
  teacherIds.forEach((tid) => addTeacherSelect(tid));
  // quarters
  quartersContainer.innerHTML = "";
  quarterIdCounter = 0;
  const quarters = (plan.quarters || []).sort(
    (a, b) => a.order_num - b.order_num
  );
  quarters.forEach((q) => {
    addQuarterUI(q.order_num, q.lessons || []);
  });

  formTitle.textContent = "✏️ Ish reja tahrirlash";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loader(false);
}

async function loadPlanForEdit(id) {
  loader(true);
  const { data: plan, error } = await sb
    .from("work_plans")
    .select(
      `
          id, name, year, class_id,
          work_plan_teachers ( id, teacher_id ),
          quarters ( id, order_num, name,
            lessons ( id, order_num, topic, hours, schedule_date )
          )
        `
    )
    .eq("id", id)
    .single();

  if (error) {
    showAlert(error.message, "err");
    loader(true);
    return;
  }

  // fill form
  planIdEl.value = plan.id;
  planNameEl.value = plan.name;
  planYearEl.value = plan.year;
  classSelectEl.value = plan.class_id;
  // clear teachers UI
  teachersContainer.innerHTML = "";
  teacherSelectIdCounter = 0;
  const teacherIds = (plan.work_plan_teachers || []).map((wt) => wt.teacher_id);
  if (teacherIds.length === 0) addTeacherSelect(); // at least one
  teacherIds.forEach((tid) => addTeacherSelect(tid));
  // quarters
  quartersContainer.innerHTML = "";
  quarterIdCounter = 0;
  const quarters = (plan.quarters || []).sort(
    (a, b) => a.order_num - b.order_num
  );
  quarters.forEach((q) => {
    addQuarterUI(q.order_num, q.lessons || []);
  });

  formTitle.textContent = "✏️ Ish reja tahrirlash";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loader(false);
}

/* ------------- UI helpers: teachers selects ------------- */
function addTeacherSelect(selectedId = "") {
  teacherSelectIdCounter++;
  const id = `teacherSel_${teacherSelectIdCounter}`;
  const div = document.createElement("div");
  div.style.marginBottom = "6px";
  const select = document.createElement("select");
  select.id = id;
  select.innerHTML =
    `<option value="">— o'qituvchi tanlang —</option>` +
    allTeachers
      .map(
        (t) =>
          `<option value="${t.id}">${escapeHtml(
            t.profiles.first_name
          )} ${escapeHtml(t.profiles.last_name)}</option>`
      )
      .join("");
  if (selectedId) select.value = selectedId;
  select.addEventListener("change", disableSelectedTeachers);
  const btnRemove = document.createElement("button");
  btnRemove.type = "button";
  btnRemove.className = "btn-ghost";
  btnRemove.style.marginLeft = "8px";
  btnRemove.textContent = "O'chirish";
  btnRemove.addEventListener("click", () => {
    div.remove();
    disableSelectedTeachers();
  });
  div.appendChild(select);
  div.appendChild(btnRemove);
  teachersContainer.appendChild(div);
  disableSelectedTeachers();
}

/* disable previously chosen teachers in other selects */
function disableSelectedTeachers() {
  const selects = [...teachersContainer.querySelectorAll("select")];
  const chosen = selects.map((s) => s.value).filter(Boolean);
  selects.forEach((s) => {
    [...s.options].forEach((opt) => {
      if (opt.value && chosen.includes(opt.value) && opt.value !== s.value)
        opt.disabled = true;
      else opt.disabled = false;
    });
  });
}

/* ------------- UI helpers: quarters and lessons ------------- */
function addQuarterUI(orderNum = null, lessons = []) {
  quarterIdCounter++;
  const qId = `quarter_${quarterIdCounter}`;
  const div = document.createElement("div");
  div.className = "quarter";
  div.id = qId;
  const qNumber =
    orderNum || quartersContainer.querySelectorAll(".quarter").length + 1;
  div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${qNumber}-chorak</strong>
          <div>
            <button type="button" class="btn-ghost" onclick="addLessonToQuarter('${qId}')">+ Dars qo'shish</button>
            <button type="button" class="btn-danger" onclick="removeQuarter('${qId}')">O'chirish</button>
          </div>
        </div>
        <div style="margin-top:8px">
          <table class="lesson-table" style="width:100%">
            <thead><tr><th style="width:60px">№</th><th>Mavzu</th><th style="width:80px">Soat</th><th style="width:140px">Taqvimiy muddat</th><th style="width:70px">Amal</th></tr></thead>
            <tbody class="lessons-body"></tbody>
          </table>
        </div>
      `;
  quartersContainer.appendChild(div);
  // if lessons provided, populate
  lessons
    .sort((a, b) => a.order_num - b.order_num)
    .forEach((ls) => {
      addLessonRow(
        div.querySelector(".lessons-body"),
        ls.order_num,
        ls.topic,
        ls.hours,
        ls.schedule_date
      );
    });
  // ensure at least one lesson row
  if (lessons.length === 0) addLessonRow(div.querySelector(".lessons-body"));
}

/* add lesson to quarter by id */
function addLessonToQuarter(qId) {
  const tbody = document.querySelector(`#${qId} .lessons-body`);
  addLessonRow(tbody);
}

/* add one lesson row to tbody */
function addLessonRow(tbody, order = null, topic = "", hours = 1, date = "") {
  const rowIndex = tbody.children.length + 1;
  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td class="lesson-index">${order || rowIndex}</td>
        <td><input type="text" class="lesson-topic" value="${escapeAttr(
          topic
        )}" placeholder="Mavzu"></td>
        <td><input type="number" class="lesson-hours" value="${escapeAttr(
          hours || 1
        )}" min="1" style="width:70px"></td>
        <td><input type="date" class="lesson-date" value="${date || ""}"></td>
        <td><button type="button" class="btn-danger" onclick="this.closest('tr').remove(); renumberLessons(this.closest('tbody'))">O'chirish</button></td>
      `;
  tbody.appendChild(tr);
  renumberLessons(tbody);
}

/* renumber lesson index columns */
function renumberLessons(tbody) {
  [...tbody.querySelectorAll("tr")].forEach((tr, i) => {
    const idxTd = tr.querySelector(".lesson-index");
    if (idxTd) idxTd.textContent = String(i + 1);
    const inpt = tr.querySelector(".lesson-topic");
    if (inpt) inpt.value = inpt.value; // noop to keep
  });
}

/* remove quarter */
function removeQuarter(qId) {
  const el = document.getElementById(qId);
  if (!el) return;
  if (!confirm("Chorakni o'chirishni istaysizmi?")) return;
  el.remove();
}

/* ------------- save plan (create or update) ------------- */
async function savePlan() {
  const planId = planIdEl.value || null;
  const name = planNameEl.value.trim();
  const year = planYearEl.value.trim();
  const class_id = classSelectEl.value;

  if (!name || !year || !class_id) {
    showAlert("Iltimos: nom, yil va sinfni to‘ldiring.", "err");
    return;
  }
  loader(true);
  btnSavePlan.disabled = true;

  try {
    if (!planId) {
      // create plan record
      const { data: newPlan, error: insErr } = await sb
        .from("work_plans")
        .insert([{ name, year, class_id }])
        .select()
        .single();
      if (insErr) throw insErr;
      // teachers
      const teacherIds = [...teachersContainer.querySelectorAll("select")]
        .map((s) => s.value)
        .filter(Boolean);
      if (teacherIds.length) {
        const wt = teacherIds.map((tid) => ({
          work_plan_id: newPlan.id,
          teacher_id: tid,
        }));
        const { error: wtErr } = await sb.from("work_plan_teachers").insert(wt);
        if (wtErr) throw showAlert(wtErr.message, "err");
      }
      // quarters & lessons
      await insertQuartersAndLessonsFromUI(newPlan.id);
      formMsg.textContent = "Ish reja yaratildi";
    } else {
      // update: update work_plans, then replace teachers, quarters/lessons
      const { error: upErr } = await sb
        .from("work_plans")
        .update({ name, year, class_id })
        .eq("id", planId);
      if (upErr) throw showAlert(upErr.message, "err");
      // replace teachers: delete existing then insert new
      const { error: delWtErr } = await sb
        .from("work_plan_teachers")
        .delete()
        .eq("work_plan_id", planId);
      if (delWtErr) throw showAlert(delWtErr.message, "err");
      const teacherIds = [...teachersContainer.querySelectorAll("select")]
        .map((s) => s.value)
        .filter(Boolean);
      if (teacherIds.length) {
        const wt = teacherIds.map((tid) => ({
          work_plan_id: planId,
          teacher_id: tid,
        }));
        const { error: wtErr } = await sb.from("work_plan_teachers").insert(wt);
        if (wtErr) throw showAlert(wtErr.message, "err");
      }
      // replace quarters/lessons: delete existing quarters (cascade will delete lessons), then insert fresh
      const { error: delQErr } = await sb
        .from("quarters")
        .delete()
        .eq("work_plan_id", planId);
      if (delQErr) throw showAlert(delQErr.message, "err");
      await insertQuartersAndLessonsFromUI(planId);
      formMsg.textContent = "Ish reja yangilandi";
    }
    await loadPlans();
    resetForm();
  } catch (err) {
    showAlert(err.message, "err");
    loader(false);
  } finally {
    btnSavePlan.disabled = false;
  }
}

/* insert quarters and lessons based on UI into DB for given planId */
async function insertQuartersAndLessonsFromUI(planId) {
  // for each quarter UI block
  const quarterEls = [...quartersContainer.querySelectorAll(".quarter")];
  for (let qi = 0; qi < quarterEls.length; qi++) {
    const qEl = quarterEls[qi];
    const order_num = qi + 1;
    const qName = `${order_num}-chorak`;
    const { data: qData, error: qErr } = await sb
      .from("quarters")
      .insert([{ work_plan_id: planId, name: qName, order_num }])
      .select()
      .single();
    if (qErr) throw showAlert(qErr.message, "err");
    const qId = qData.id;
    // collect lessons
    const tbody = qEl.querySelector(".lessons-body");
    const rows = [...tbody.querySelectorAll("tr")];
    if (rows.length) {
      const lessonsPayload = rows
        .map((tr, idx) => {
          const order_num = idx + 1;
          const topic = tr.querySelector(".lesson-topic").value.trim();
          const hours = parseInt(tr.querySelector(".lesson-hours").value) || 1;
          const schedule_date = tr.querySelector(".lesson-date").value || null;
          return {
            quarter_id: qId,
            order_num,
            topic,
            hours,
            schedule_date,
          };
        })
        .filter((l) => l.topic); // skip empty topics
      if (lessonsPayload.length) {
        const { error: lsErr } = await sb
          .from("lessons")
          .insert(lessonsPayload);
        if (lsErr) throw showAlert(lsErr.message, "err");
      }
    }
  }
}

/* ------------- delete plan ------------- */
async function deletePlanConfirmed(planId) {
  if (
    !confirm(
      "Ish reja va uning barcha choraklari/darslari o'chadi. Davom etasizmi?"
    )
  )
    return;
  const { error } = await sb.from("work_plans").delete().eq("id", planId);
  if (error) {
    showAlert(error.message, "err");
    return;
  }
  showAlert("Ish Reja O'chirldi", "success");
  document.getElementById("lessonsModal").classList.add("hidden");
  document.getElementById("wrapCont").classList.remove("hidden");
  await loadPlans();
}

/* ------------- reset form ------------- */
function resetForm() {
  document.getElementById("planModal").classList.add("hidden");
  document.getElementById("wrapCont").classList.remove("hidden");
  planIdEl.value = "";
  planNameEl.value = "";
  planYearEl.value = "";
  teachersContainer.innerHTML = "";
  quartersContainer.innerHTML = "";
  formTitle.textContent = "➕ Yangi ish reja";
  formMsg.textContent = "";
  addTeacherSelect();
  addQuarterUI(); // one quarter by default
  currentPlan = null;
}

/* ------------- helper escape ------------- */
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(s) {
  if (!s && s !== 0) return "";
  return String(s).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function closeInfo() {
  $("wrapCont").classList.remove("hidden");
  $("planModal").classList.add("hidden");
  $("lessonsModal").classList.add("hidden");
}
