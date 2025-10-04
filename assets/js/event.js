// 📌 Eng so‘nggi uchta yangilikni olish funksiyasi (user ismi va familiyasi bilan)
async function getLatestThreeNews() {
  try {
    // Event
    const { data: latestEvent, error: eventError } = await sb
      .from("news")
      .select(
        `
        id,
        title,
        description,
        type,
        image_url,
        created_at,
        users:created_by (
          first_name,
          last_name
        )
      `
      )
      .eq("type", "event")
      .order("created_at", { ascending: false });

    if (eventError) throw eventError;
    // 📦 Natijalarni yig‘ib qaytaramiz
    return latestEvent;
  } catch (err) {
    console.error("❌ getLatestThreeNews error:", err.message);
    return [];
  }
}

async function updateNews() {
  const latest = await getLatestThreeNews();
  $("newsList").innerHTML = "";
  if (latest.length == 0) {
    $("newsList").innerHTML = `
    <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
    <h1 class="small-muted">Hozircha Hech Qanday Tadbir Yo'q</h1>
    </div>
    `;
    return;
  }
  latest.forEach((item) => {
    $("newsList").innerHTML += `
    <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="courses-item d-flex flex-column bg-white overflow-hidden h-100">
                        <div class="text-center p-4 pt-0">
                            <div class="d-inline-block bg-primary text-white fs-5 py-1 px-4 mb-4">Tadbir</div>
                            <h5 class="mb-3">${item.title}</h5>
                            <p>${item.description}</p>
                            <ol class="breadcrumb justify-content-center mb-0">
                                <li class="breadcrumb-item small"><i class="fa fa-signal text-primary me-2"></i>${
                                  item.type == "event"
                                    ? "Tadbir"
                                    : item.type == "news"
                                    ? "Yangilik"
                                    : item.type == "elon"
                                    ? "Elon"
                                    : ""
                                }</li>
                                <li class="breadcrumb-item small"><i class="fa fa-calendar-alt text-primary me-2"></i>${
                                  item.created_at
                                }</li>
<li class="breadcrumb-item small"><i class="fa fa-user text-primary me-2"></i>${
      item.users.first_name
    } ${item.users.last_name}</li>
                            </ol>
                        </div>
                        <div class="position-relative mt-auto">
                            <img class="img-fluid" src=${item.image_url} alt="">
                            <div class="courses-overlay">
                                <a class="btn btn-outline-primary border-2" href="more.html?id=${
                                  item.id
                                }">Ko'proq Bilish</a>
                            </div>
                        </div>
                    </div>
                </div>
    `;
  });
}

updateNews();

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
