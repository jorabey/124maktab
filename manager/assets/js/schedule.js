 // DOM
      const schedulesList = document.getElementById("schedulesList");
      const btnNew = document.getElementById("btnNew");
      const btnReload = document.getElementById("btnReload");
      const detailsCard = document.getElementById("detailsCard");
      const detailTitle = document.getElementById("detailTitle");
      const detailMeta = document.getElementById("detailMeta");
      const detailBody = document.getElementById("detailBody");

      const formTitle = document.getElementById("formTitle");
      const scheduleIdEl = document.getElementById("scheduleId");
      const classSelect = document.getElementById("classSelect");
      const typeSelect = document.getElementById("typeSelect");
      const weekContainer = document.getElementById("weekContainer");
      const btnSave = document.getElementById("btnSave");
      const btnCancel = document.getElementById("btnCancel");
      const formMsg = document.getElementById("formMsg");
      const btnEdit = document.getElementById("btnEdit");
      const btnDelete = document.getElementById("btnDelete");

      const DAYS = [
        "Dushanba",
        "Seshanba",
        "Chorshanba",
        "Payshanba",
        "Juma",
        "Shanba",
        "Yakshanba",
      ];

      let allTeachers = []; // {id, first_name, last_name, full_name}
      let allClasses = []; // {id, name}
      let currentSchedule = null;




      //Real-Time
function startPresence() {
     channel = sb.channel('online-users', {
        config: { presence: { key: CURRENT_USER.id } }
      })

      channel.on('presence', { event: 'sync' }, () => {
        presenceState = channel.presenceState()
        getInfo()
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
    showAlert(error.message,'err');
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





      /* ------------- init ------------- */
      document.addEventListener("DOMContentLoaded", init);
      btnNew.addEventListener("click", () => {
        document.getElementById("wrapCont").classList.add("hidden");
        document.getElementById("planModal").classList.remove("hidden");
        showCreateForm();
      });
      btnReload.addEventListener("click", loadSchedules);
      btnSave.addEventListener("click", handleSave);
      btnCancel.addEventListener("click", () => {
        document.getElementById("wrapCont").classList.remove("hidden");
        document.getElementById("planModal").classList.add("hidden");

        closeInfo()
        resetForm();
      });
      btnEdit.addEventListener("click", () => {
        document.getElementById("lessonsModal").classList.add("hidden");
        document.getElementById("planModal").classList.remove("hidden");
        if (currentSchedule) loadIntoForm(currentSchedule.id);
      });
      btnDelete.addEventListener("click", async () => {
        if (currentSchedule) await deleteSchedule(currentSchedule.id);
      });

      async function init() {
        loader(true)
        await loadRefs();
        await loadSchedules();
        resetForm();
        loader(false)
      }

      function close() {
        document.getElementById("wrapCont").classList.remove("hidden");
        document.getElementById("planModal").classList.add("hidden");
        document.getElementById("lessonsModal").classList.add("hidden");
      }

      /* ------------- load reference data: classes, teachers ------------- */
      async function loadRefs() {
        // classes
        const { data: classesData, error: clErr } = await sb
          .from("classes")
          .select("id, name")
          .order("name");
        if (clErr) {
          showAlert(clErr.message,'err')
          return;
        }
        allClasses = classesData || [];
        classSelect.innerHTML = allClasses
          .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
          .join("");

        // teachers: try first_name/last_name, fallback to profiles(full_name)
        let teachers = [];
        // 1) try first_name,last_name
        let res = await sb
          .from("teachers")
          .select("id, profiles(first_name, last_name)")
          .limit(1000);
        if (!res.error && res.data && res.data.length) {
          teachers = res.data.map((t) => ({
            id: t.id,
            first_name: t.profiles.first_name || "",
            last_name: t.profiles.last_name || "",
            full_name: (
              (t.profiles.first_name || "") +
              " " +
              (t.profileslast_name || "")
            ).trim(),
          }));
        } else {
          // 2) fallback: join profiles
          let r2 = await sb
            .from("teachers")
            .select("id, user_id, profiles ( id, first_name,last_name )")
            .limit(1000);
          if (!r2.error && r2.data) {
            teachers = r2.data.map((t) => ({
              id: t.id,
              full_name:
                `${t.profiles?.first_name} ${t.profiles?.last_name}` ||
                t.user_id ||
                "",
            }));
          } else {
            // 3) final fallback: select * and try to build name
            let r3 = await sb
              .from("teachers")
              .select("id, user_id, profiles ( id, first_name,last_name )")
              .limit(1000);
            if (!r3.error && r3.data) {
              teachers = r3.data.map((t) => ({
                id: t.id,
                full_name:
                  t.full_name ||
                  t.name ||
                  (
                    (t.profiles.first_name || "") +
                    " " +
                    (t.profiles.last_name || "")
                  ).trim(),
              }));
            }
          }
        }
        allTeachers = teachers;
      }

      /* ------------- schedules list ------------- */
      async function loadSchedules() {
        loader(true)
        const { data, error } = await sb
          .from("schedules")
          .select("id, type, created_at, class_id, classes ( id, name )")
          .order("created_at", { ascending: false });

        if (error) {
          showAlert(error.message,'err')
          return;
        }
        schedulesList.innerHTML = "";
        loader(false)
        for (const [i,s] of (data || []).entries()) {
          // get distinct teacher count for this schedule
          const { data: lsData, error: lsErr } = await sb
            .from("schedule_lessons")
            .select("teacher_id")
            .eq("schedule_id", s.id);
          let teacherCount = 0;
          if (!lsErr && Array.isArray(lsData)) {
            const set = new Set(
              lsData.map((x) => x.teacher_id).filter(Boolean)
            );
            teacherCount = set.size;
          }
          const div = document.createElement("tr");
          div.innerHTML = `

          <tr>
            <td>${i+1}</td>
            <td>${escapeHtml(s.classes?.name || "—")}</td>
            <td>${new Date(s.created_at).toLocaleString()}</td>
            <td>(${escapeHtml(s.type || "")})</td>
            <td> <button class="btn-ghost" data-id="${
              s.id
            }" onclick="viewHandler(event)">Ko'rish</button>
          <button class="btn-ghost" data-id="${
            s.id
          }" onclick="editHandler(event)">Tahrirlash</button></td>
          </tr>
    `;
          schedulesList.appendChild(div);
        }
      }

      /* handlers */
      window.viewHandler = async (e) => {
        document.getElementById("wrapCont").classList.add("hidden");
        document.getElementById("lessonsModal").classList.remove("hidden");
        const id = e.currentTarget.dataset.id;
        await viewSchedule(id);
      };
      window.editHandler = async (e) => {
        document.getElementById("wrapCont").classList.add("hidden");
        document.getElementById("planModal").classList.remove("hidden");
        const id = e.currentTarget.dataset.id;
        await loadIntoForm(id);
      };

      /* ------------- view schedule details ------------- */
      async function viewSchedule(id) {
        loader(true)
        const { data: s, error } = await sb
          .from("schedules")
          .select(
            `
      id, type, created_at, class_id,
      classes ( id, name ),
      schedule_lessons ( id, day, subject, start_time, end_time, teacher_id, teachers ( id, profiles(first_name,last_name) ) )
    `
          )
          .eq("id", id)
          .single();

        if (error) {
         showAlert(error.message,'err')
         loader(false)
          return;
        }

        currentSchedule = s;
        detailTitle.textContent = `Sinf:${s.classes?.name}`;
        detailMeta.textContent = `Turi:${s.type}`;
        document.getElementById(
          "workYear"
        ).textContent = `Yaratilgan: ${new Date(
          s.created_at
        ).toLocaleString()}`;

        // group lessons by day
        const lessons = s.schedule_lessons || [];
        const byDay = {};
        for (const l of lessons) {
          if (!byDay[l.day]) byDay[l.day] = [];
          byDay[l.day].push(l);
        }
        // render
        let html = "";
        let dars = "";
        for (const day of DAYS) {
          const arr = byDay[day] || [];
          if (arr.length === 0) {
            dars = `<div class="small muted">Hech qanday dars yo'q</div>`;
          } else {
            arr.sort((a, b) => a.order_num - b.order_num); // if order_num exists
            arr.forEach((l, i) => {
              const t =
                l.teachers &&
                (l.teachers.profiles.first_name ||
                  l.teachers.profiles.last_name)
                  ? `${l.teachers.profiles.first_name || ""} ${
                      l.teachers.profiles.last_name || ""
                    }`.trim()
                  : l.teachers?.profiles?.first_name || "";

              dars += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${escapeHtml(l.subject)}</td>
              <td>${l.start_time}</td>
              <td>${l.end_time}</td>
              <td>${escapeHtml(t)}</td>
                </tr>
                `;
            });
          }
          html += ` <div class="col-12 grid-margin">
                <div class="card">
                  <div class="card-body">
                    <h4 class="card-title">${day}</h4>
                    <div class="table-responsive">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Dars №</th>
                            <th>Fan</th>
                            <th>Kirish Vaqti</th>
                            <th>Chiqish Vaqti</th>
                            <th>O'qituvchi</th>
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
        }
        detailBody.innerHTML = html;
        loader(false)
      }

      /* ------------- load into form for edit ------------- */
      async function loadIntoForm(id) {
        loader(true)
        const { data: s, error } = await sb
          .from("schedules")
          .select(
            `
      id, type, class_id,
      schedule_lessons ( id, day, subject, start_time, end_time, teacher_id )
    `
          )
          .eq("id", id)
          .single();

        if (error) {
         showAlert(error.message,'err')
          loader(false)
          return;
        }

        // fill form
        scheduleIdEl.value = s.id;
        classSelect.value = s.class_id;
        typeSelect.value = s.type || "public";
        // populate week UI
        weekContainer.innerHTML = "";
        for (const day of DAYS) {
          const dayLessons = (s.schedule_lessons || []).filter(
            (x) => x.day === day
          );
          createDayBlock(day, dayLessons);
        }

        formTitle.textContent = "✏️ Jadvalni tahrirlash";
        window.scrollTo({ top: 0, behavior: "smooth" });
        loader(false)
      }

      /* ------------- show create form ------------- */
      function showCreateForm() {
        resetForm();
        weekContainer.innerHTML = "";
        for (const day of DAYS) createDayBlock(day, []);
        document.getElementById("scheduleId").value = "";
        formTitle.textContent = "➕ Yangi jadval";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      /* ------------- create day UI block ------------- */
      function createDayBlock(day, lessons = []) {
        const wrapper = document.createElement("div");
        wrapper.className = "day-block";
        wrapper.dataset.day = day;
        wrapper.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${day}</strong>
    <div><button type="button" class="btn-ghost" onclick="addLessonRow(this.closest('.day-block'))">+ Dars qo'shish</button></div></div>
    <div style="margin-top:10px">
      <table><thead><tr><th style="width:40px">No</th><th>Fan</th><th style="width:110px">Kirish</th><th style="width:110px">Chiqish</th><th style="width:220px">O'qituvchi</th><th style="width:80px">Amal</th></tr></thead>
      <tbody class="lessons-body"></tbody></table>
    </div>`;
        weekContainer.appendChild(wrapper);
        const tbody = wrapper.querySelector(".lessons-body");
        if (lessons.length) {
          lessons.forEach((l) => addLessonRow(wrapper, l));
        } else {
          // default none
        }
      }

      /* ------------- add lesson row ------------- */
      function addLessonRow(dayBlock, lesson = null) {
        const tbody = dayBlock.querySelector(".lessons-body");
        const tr = document.createElement("tr");
        const index = tbody.children.length + 1;
        const teacherOptions = allTeachers
          .map((t) => {
            // t may have first_name/last_name or full_name
            const name =
              t.first_name || t.last_name
                ? ((t.first_name || "") + " " + (t.last_name || "")).trim()
                : t.full_name || "";
            return `<option value="${t.id}">${escapeHtml(name)}</option>`;
          })
          .join("");
        tr.innerHTML = `
    <td class="idx">${index}</td>
    <td><input type="text" class="fld-subject" value="${escapeAttr(
      lesson?.subject || ""
    )}" placeholder="Fan nomi" /></td>
    <td><input type="time" class="fld-start" value="${escapeAttr(
      lesson?.start_time || "08:00"
    )}" /></td>
    <td><input type="time" class="fld-end" value="${escapeAttr(
      lesson?.end_time || "08:45"
    )}" /></td>
    <td><select class="fld-teacher"><option value="">— tanlang —</option>${teacherOptions}</select></td>
    <td><button type="button" class="btn-danger" onclick="this.closest('tr').remove(); renumber(this.closest('tbody'))">O'chirish</button></td>
  `;
        tbody.appendChild(tr);
        // set teacher if provided
        if (lesson?.teacher_id) {
          tr.querySelector(".fld-teacher").value = lesson.teacher_id;
        }
      }

      /* renumber */
      function renumber(tbody) {
        [...tbody.querySelectorAll("tr")].forEach((tr, i) => {
          const idx = tr.querySelector(".idx");
          if (idx) idx.textContent = String(i + 1);
        });
      }

      /* ------------- save (create or update) ------------- */
      async function handleSave() {
        const scheduleId = scheduleIdEl.value || null;
        const classId = classSelect.value;
        const type = typeSelect.value;

        if (!classId) {
          showAlert('Sinfni Tanlang','err')
          return;
        }
        loader(true)
        btnSave.disabled = true;

        try {
          // check if class already has schedule (except when updating same)
          const { data: existing, error: exErr } = await sb
            .from("schedules")
            .select("id")
            .eq("class_id", classId)
            .limit(1);
          if (exErr) throw exErr;
          if (!scheduleId && existing && existing.length > 0) {
            showAlert("❌ Bu sinfga allaqachon jadval biriktirilgan",'err')
            loader(false)
            btnSave.disabled = false;
            return;
          }
          if (
            scheduleId &&
            existing &&
            existing.length > 0 &&
            existing[0].id !== scheduleId
          ) {
            showAlert("❌ Bu sinfga allaqachon jadval biriktirilgan",'err')
            loader(false)
            btnSave.disabled = false;
            return;
          }

          if (!scheduleId) {
            // create schedule
            const { data: newSch, error: insErr } = await sb
              .from("schedules")
              .insert([{ class_id: classId, type }])
              .select()
              .single();
            if (insErr) throw showAlert(insErr,'err');
            await insertLessonsForSchedule(newSch.id);
            loader(false)
            showAlert("Jadval Yaratildi",'success')
            closeInfo()
          } else {
            // update schedule meta
            const { error: updErr } = await sb
              .from("schedules")
              .update({ class_id: classId, type })
              .eq("id", scheduleId);
            if (updErr) throw showAlert(updErr.message,'err');
            // delete existing lessons then insert fresh
            const { error: delErr } = await sb
              .from("schedule_lessons")
              .delete()
              .eq("schedule_id", scheduleId);
            if (delErr) throw showAlert(delErr,message,'err');
            await insertLessonsForSchedule(scheduleId);
            showAlert('Jadval Yangilandi','success')
            closeInfo()
          }

          await loadSchedules();
          resetForm();
        } catch (err) {
          showAlert(err.message,'err')
        } finally {
          btnSave.disabled = false;
        }
      }

      /* insert lessons gathered from UI for given schedule */
      async function insertLessonsForSchedule(scheduleId) {
        const quarterEls = [...weekContainer.querySelectorAll(".day-block")];
        const payload = [];
        for (const qEl of quarterEls) {
          const day = qEl.dataset.day;
          const rows = [...qEl.querySelectorAll(".lessons-body tr")];
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const subject = row.querySelector(".fld-subject").value.trim();
            const start = row.querySelector(".fld-start").value;
            const end = row.querySelector(".fld-end").value;
            const teacher_id = row.querySelector(".fld-teacher").value || null;
            if (!subject || !start || !end) continue;
            payload.push({
              schedule_id: scheduleId,
              day,
              subject,
              start_time: start,
              end_time: end,
              teacher_id,
            });
          }
        }
        if (payload.length) {
          // bulk insert
          const { error } = await sb.from("schedule_lessons").insert(payload);
          if (error) throw showAlert(error.message,'err');
        }
      }

      /* ------------- delete schedule ------------- */
      async function deleteSchedule(id) {
        if (
          !confirm(
            "Ishonchingiz komilmi? Jadval va uning barcha darslari o'chadi."
          )
        )
          return;
        const { error } = await sb.from("schedules").delete().eq("id", id);
        if (error) {
          showAlert(error.message,'err');
          return;
        }
        showAlert("Jadval O'chirildi",'err')
        closeInfo()
        await loadSchedules();
      }

      /* ------------- reset form ------------- */
      function resetForm() {
        scheduleIdEl.value = "";
        formTitle.textContent = "➕ Yangi jadval";
        classSelect.selectedIndex = 0;
        typeSelect.value = "public";
        weekContainer.innerHTML = "";
        for (const day of DAYS) createDayBlock(day, []);
        formMsg.textContent = "";
        currentSchedule = null;
      }

      /* ------------- helpers ------------- */
      function escapeHtml(s) {
        if (s === null || s === undefined) return "";
        return String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }
      function escapeAttr(s) {
        if (s === null || s === undefined) return "";
        return String(s).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
      }



 function closeInfo(){
  $('wrapCont').classList.remove('hidden');
  $('planModal').classList.add('hidden')
  $('lessonsModal').classList.add('hidden')
 }