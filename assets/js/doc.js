async function getDocs() {
  try {
    const { data, error } = await sb
      .from("documents")
      .select("*")
      .in("public", ["true"]); // faqat shu rollarni olamiz

    if (error) throw error;

    return data; // userlar ro'yxati
  } catch (err) {
    console.error("❌ getManagersAndDirectors error:", err.message);
    return [];
  }
}

async function updateDoc() {
  const doc = await getDocs();
  $("docList").innerHTML = "";
  if (doc == 0) {
    $("docList").innerHTML = `
       <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
    <h1 class="small-muted">Hozircha Hech Qanday Hujjat Yo'q</h1>
    </div>
     `;
    return;
  }
  doc.forEach((item) => {
    $("docList").innerHTML += `
    <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                    <div class="courses-item d-flex flex-column bg-light overflow-hidden h-100">
                        <div class="text-center p-4 pt-0">
                            <h5 class="mb-3">${item.name}</h5>
                            <p>${item.description}</p>
                        </div>
        
                                <a class="btn btn-outline-primary border-2" href=${item.file_url}>Yuklab Olish <i class="fa fa-download"></i></a>
                    </div>
              </div>
    `;
  });
}
updateDoc();

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
