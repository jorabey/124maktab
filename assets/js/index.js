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
      .order("created_at", { ascending: false })
      .limit(1);

    if (eventError) throw eventError;

    // News
    const { data: latestNews, error: newsError } = await sb
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
      .eq("type", "news")
      .order("created_at", { ascending: false })
      .limit(1);

    if (newsError) throw newsError;

    // Elon
    const { data: latestElon, error: elonError } = await sb
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
      .eq("type", "elon")
      .order("created_at", { ascending: false })
      .limit(1);

    if (elonError) throw elonError;

    // 📦 Natijalarni yig‘ib qaytaramiz
    return [
      ...(latestEvent || []),
      ...(latestNews || []),
      ...(latestElon || []),
    ];
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
    <h1 class="small-muted">Hozircha Hech Qanday Yangilik Yo'q</h1>
    </div>
    `;
    return;
  }
  latest.forEach((item) => {
    $("newsList").innerHTML += `
    <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="courses-item d-flex flex-column bg-white overflow-hidden h-100">
                        <div class="text-center p-4 pt-0">
                            <div class="d-inline-block bg-primary text-white fs-5 py-1 px-4 mb-4">yangi</div>
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

// 📌 Manager va Director bo'lgan userlarni olish funksiyasi
async function getManagersAndDirectors() {
  try {
    const { data, error } = await sb
      .from("profiles")
      .select("id, first_name, last_name, role,position,avatar_url,email,phone")
      .in("role", ["manager", "director"]); // faqat shu rollarni olamiz

    if (error) throw error;

    return data; // userlar ro'yxati
  } catch (err) {
    console.error("❌ getManagersAndDirectors error:", err.message);
    return [];
  }
}

async function updateRax() {
  const rax = await getManagersAndDirectors();
  $("raxList").innerHTML = "";
  if (rax.length == 0) {
    $("raxList").innerHTML = `
     <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
    <h1 class="small-muted">Hozircha Hech Qanday Hodim Yo'q</h1>
    </div>
    `;
    return;
  }
  rax.forEach((item, i) => {
    $("raxList").innerHTML += `
    <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay=${
      i == 0 ? "0.1" : i == 1 ? "0.3" : i == 2 ? "0.5" : "0.7"
    }>
                    <div class="team-item position-relative">
                        <div class="position-relative">
                            <img class="img-fluid" src=${
                              item.avatar_url || "img/team-2.jpg"
                            } alt="">
                            <div class="team-social text-center">
                                <a class="btn btn-square btn-outline-primary border-2 m-1" href="mailto:${
                                  item.email
                                }"><i class="fa fa-envelope"></i></a>
                                <a class="btn btn-square btn-outline-primary border-2 m-1" href="tel:${
                                  item.phone
                                }"><i class="fa fa-phone"></i></a>
                            </div>
                        </div>
                        <div class="bg-light text-center p-4">
                            <h5 class="mt-2">${item.first_name} ${
      item.last_name
    }</h5>
                            <span>${item.position}</span>
                        </div>
                    </div>
                </div>
    `;
  });
}

updateRax();

function currentPage() {
  current = window.location.href;
  const prev = sessionStorage.getItem("currentURL");
  if (prev && prev !== current) {
    sessionStorage.setItem("previosURL", prev);
  }

  sessionStorage.setItem("currentURL", current);
}

currentPage();
