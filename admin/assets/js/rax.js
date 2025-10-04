//Real-Time
function startPresence() {
  channel = sb.channel("online-users", {
    config: { presence: { key: CURRENT_USER.id } },
  });

  channel.on("presence", { event: "sync" }, () => {
    presenceState = channel.presenceState();
    getInfo();
    getRax();
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

//Get School Big User

async function getRax() {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["manager", "director", "manager-teacher"]);

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
    <tr style="cursor: pointer;" onclick=getRaxInfo("${user.id || null}")>
                            <td>${i + 1}</td>
                            <td>
                              <img src="${
                                user.avatar_url ||
                                "../../assets/images/jpg/user-icon.jpg"
                              }" class="me-2" alt="image">${
      [user.first_name || "", user.last_name || ""].join(" ").trim() ||
      user.login
    }
                            </td>
                            <td> ${user.position || "-"} </td>
                            <td> ${user.role || "-"} </td>
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
    `;
  });
}

// Get School Big User Big Info
async function getRaxInfo(userId) {
  $("wrapCont").classList.add("hidden");
  $("infoModal").classList.remove("hidden");
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["director", "manager", "manager-teacher"]);

  if (error) {
    showAlert(error.message, "err");
    return;
  }

  const onlineIds = Object.keys(presenceState);

  data.forEach((user) => {
    if (user.id == userId) {
      const isOnline = onlineIds.includes(user.id);
      $("infoCont").innerHTML = `
     <div class="col-md-2">
    <label class="form-label">Rasm</label>
    <img height="200" class="form-control" src="${
      user.avatar_url || "../../assets/images/jpg/user-icon.jpg"
    }">
  </div>
  
  <div class="col-md-4">
    <label class="form-label">Ism</label>
    <input type="text" class="form-control" placeholder=${
      user.first_name || ""
    } disabled>
    <label class="form-label">Familya</label>
    <input type="text" class="form-control" placeholder=${
      user.last_name || ""
    }  disabled>
    <label class="form-label">Otasining Ismi</label>
    <input type="text" class="form-control"  placeholder=${
      user.middle_name || ""
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Holati</label>
    <label class="badge form-control ${
      isOnline ? "badge-gradient-success" : "badge-gradient-danger"
    }">${isOnline ? "Onlayn" : "Oflayn"}</label>
  </div>
  
   <div class="col-md-4">
    <label class="form-label">Tug'ilgan Sana</label>
    <input type="text" class="form-control" placeholder=${
      user.birth_date || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Jins</label>
    <input type="text" class="form-control"  placeholder=${
      user.gender || "-"
    }  disabled>
  </div>
   <div class="col-md-4">
    <label class="form-label">Lavozimi</label>
    <input type="text" class="form-control"  placeholder=${
      user.position || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Role</label>
    <input type="text" class="form-control"  placeholder=${
      user.role || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Passport Seriya</label>
    <input type="text" class="form-control"  placeholder=${
      user.passport_serial || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Yashash Manzil</label>
    <input type="text" class="form-control"  placeholder=${
      user.location || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Telefon Raqam</label>
    <input type="text" class="form-control"  placeholder=${
      user.phone || "-"
    }  disabled>
  </div>
   <div class="col-md-4">
    <label class="form-label">Elektron Pochta</label>
    <input type="text" class="form-control"  placeholder=${
      user.email || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Login</label>
    <input type="text" class="form-control"  placeholder=${
      user.login || "-"
    }  disabled>
  </div>
  <div class="col-md-4">
    <label class="form-label">Parol</label>
    <input type="text" class="form-control"  placeholder=${
      user.password || "-"
    }  disabled>
  </div>
  <div class="col-12">
    <button onclick=ed() type="button" class="btn btn-success">Tahrirlash</button>
    <button onclick=deleteUser("${
      user.id || null
    }") type="button" class="btn btn-danger">O'chirish</button>
  </div>
    `;
    }
  });
}

function ed() {
  showAlert("Hozircha Bu Xizmat Ishlamaydi!", "err");
}

// Edit School Big User
async function setInfo(userId) {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["manager", "director", "manager-teacher"]);

  if (error) {
    showAlert(error.message, "err");
    return;
  }

  let userAvatar = null;
  let userLogin = null;
  data.forEach((user) => {
    if (user.id == userId) {
      $("login2").value = user.login;
      $("password2").value = user.password;
      $("first_name2").value = user.first_name;
      $("last_name2").value = user.last_name;
      $("tel2").value = user.phone;
      $("position2").value = user.position;
      $("passport_serial2").value = user.passport_serial;
      $("middle_name2").value = user.middle_name;
      $("gender2").value = user.gender;
      $("birth_date2").value = user.birth_date; // YYYY-MM-DD yoki null
      $("location2").value = user.location;
      $("email2").value = user.email;
      userAvatar = user.avatarUrl;
      userLogin = user.login;
    }
  });

  return { avatar: userAvatar };
}

async function editUser(userId) {
  $("editUserFormModal").classList.remove("hidden");
  $("infoModal").classList.add("hidden");
  const oldUser = setInfo(userId);
  $("editUserForm").addEventListener("submit", async (e) => {
    loader(true);
    e.preventDefault();
    const login = $("login2").value.trim().toLowerCase();
    const password = $("password2").value;
    const first = $("first_name2").value.trim();
    const last = $("last_name2").value.trim();
    const phone = $("tel2").value.trim();
    const ord = "manager";
    const position = $("position2").value.trim();
    const passport_serial = $("passport_serial2").value.trim();
    const midl = $("middle_name2").value.trim();
    const gender = $("gender2").value || null;
    const birth = $("birth_date2").value || null; // YYYY-MM-DD yoki null
    const avatarFile = $("userImgFile2").files[0];
    const email = $("email2").value.trim();
    const location = $("location2").value.trim();
    const email_for_signup = `${login}@124maktab.uz`;

    await sb.auth.updateUser({
      email: email_for_signup, // login o‘zgartirish
      password: password, // parol o‘zgartirish
    });

    let avatarUrl = await uploadAvatarB(avatarFile);

    const updatedData = {
      id: userId,
      avatar_url: oldUser.avatar ? oldUser.avatar : avatarUrl,
      first_name: first,
      last_name: last,
      middle_name: midl,
      birth_date: birth,
      gender: gender,
      phone: phone,
      role: ord,
      passport_serial: passport_serial,
      location: location,
      position: position,
      login: login,
      password: password,
      email: email,
    };

    const { error } = await sb
      .from("profiles")
      .update(updatedData)
      .eq("id", userId);

    if (error) {
      showAlert(error.message, "err");
    } else {
      loader(false);
      showAlert(" Hodim ma’lumotlari yangilandi", "success");
      closeInfo();
      startPresence();
    }
  });
}

// Delete School Big User
async function deleteUser(userId) {
  loader(true);
  try {
    const res = await fetch(
      "https://maktab-backend-six.vercel.app/api/delete-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    const result = await res.json();
    loader(false);
    showAlert(result.message, "success");
    closeInfo();
    startPresence();
  } catch (err) {
    showAlert(err, "err");
  }
}

//Add School Big User
$("addUserForm").addEventListener("submit", async (e) => {
  loader(true);
  e.preventDefault();
  const login = $("login").value.trim().toLowerCase();
  const password = $("password").value;

  if (!login || !password) {
    showAlert("Iltimos Ma'lumotlarni To'g'ri Kiriting!", "err");
    loader(false);
    return;
  }

  const form = e.target;
  const data = new FormData(form);
  const response = await fetch(
    "https://maktab-backend-six.vercel.app/api/admin-signup",
    {
      method: "POST",
      body: data,
    }
  );

  const result = await response.json();
  loader(false);
  result.success
    ? showAlert("Hodim Qo'shildi", "success")
    : showAlert(result.error, "err");
  $("addUserForm").reset();
  closeInfo();
  startPresence();
});

// Upload Avatar for Supa Base Bucket "avatars"
async function uploadAvatarB(file) {
  if (!file) {
    return null;
  }
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    "https://maktab-backend-six.vercel.app/api/image-upload.js",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  if (data.url) {
    return data.url;
  } else {
    throw new Error(data.error || "Yuklashda xato");
  }
}

$("showAddUserForm").addEventListener("click", () => {
  $("wrapCont").classList.add("hidden");
  $("addUserFormModal").classList.remove("hidden");
});

$("closeAddUserForm").addEventListener("click", () => {
  $("addUserFormModal").classList.add("hidden");
  $("wrapCont").classList.remove("hidden");
});

$("closeEditUserForm").addEventListener("click", () => {
  $("editUserFormModal").classList.add("hidden");
  $("infoModal").classList.remove("hidden");
});

function closeInfo() {
  $("wrapCont").classList.remove("hidden");
  $("infoModal").classList.add("hidden");
  $("addUserFormModal").classList.add("hidden");
  $("editUserFormModal").classList.add("hidden");
}
