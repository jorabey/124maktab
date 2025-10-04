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

  // 2) O‘qituvchilar soni
  const { count: managerTeachersCount, error: err5 } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "manager-teacher");

  const { count: libraryCount, error: err4 } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "library");

  // 3) O‘quvchilar soni
  const { count: studentsCount, error: err3 } = await sb
    .from("students")
    .select("*", { count: "exact", head: true });

  if (err1 || err2 || err3 || err5) {
    showAlert(
      err1.message ||
        err2.message ||
        err3.message ||
        err4.message ||
        err5.message,
      "err"
    );
    return;
  }

  let totalUser =
    managerCount + teachersCount + libraryCount + managerTeachersCount;
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
                    <h2 class="mb-5">${
                      teachersCount + managerTeachersCount
                    }</h2>
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
