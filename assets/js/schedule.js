// hafta kunlari tartibda
const weekdays = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

async function loadSchedules() {
  const container = document.getElementById("schedulesList");
  container.innerHTML = "Yuklanmoqda...";

  const { data: schedules, error } = await sb
    .from("schedules")
    .select(
      `
      id, 
      class_id,
      type, 
      classes(name), 
      schedule_lessons (
        id, day, subject, start_time, end_time,
        teachers (id, profiles(first_name,last_name))
      )
    `
    )
    .eq("type", "public")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = "❌ Xatolik: " + error.message;
    return;
  }

  container.innerHTML = "";
  schedules.forEach((sch) => {
    const card = document.createElement("div");
    card.className = "schedule-card";

    // title
    card.innerHTML = `<div class="schedule-title">
        <h5 class="text-light">${sch.classes?.name || "-"} jadvali</h5>
      </div>`;

    // lessons grid
    const grid = document.createElement("div");
    grid.className = "lessons-grid";

    weekdays.forEach((day) => {
      const col = document.createElement("div");
      col.className = "day-col";
      col.innerHTML = `<h6>${day}</h6>`;

      const lessons = (sch.schedule_lessons || [])
        .filter((l) => l.day === day)
        .sort((a, b) => (a.start_time > b.start_time ? 1 : -1));

      if (lessons.length === 0) {
        col.innerHTML += `<div class="text-muted text-center">-</div>`;
      } else {
        lessons.forEach((l, idx) => {
          const teacherName = l.teachers?.profiles
            ? `${l.teachers.profiles.first_name} ${l.teachers.profiles.last_name}`
            : "-";
          col.innerHTML += `
            <div class="lesson">
              <strong>${idx + 1}-soat: ${l.subject}</strong>
              <small>${l.start_time.slice(0, 5)} - ${l.end_time.slice(
            0,
            5
          )}</small>
              <small>${teacherName}</small>
            </div>`;
        });
      }
      grid.appendChild(col);
    });

    card.appendChild(grid);
    container.appendChild(card);
  });
}

function currentPage() {
  current = window.location.href;
  const prev = sessionStorage.getItem("currentURL");
  if (prev && prev !== current) {
    sessionStorage.setItem("previosURL", prev);
  }

  sessionStorage.setItem("currentURL", current);
}

function getPreviousURL() {
  const saved = sessionStorage.getItem("previosURL");
  if (saved) return saved;

  if (document.referrar && document.referrar !== window.location.href) {
    return document.referrar;
  }

  return null;
}

function setPage() {
  const prev = getPreviousURL();
  if (prev) {
    $("prevPage").classList.remove("hidden");
    $("prevPage").href = prev;
  } else {
    $("prevPage").classList.add("hidden");
  }
}

setPage();
currentPage();

loadSchedules();
