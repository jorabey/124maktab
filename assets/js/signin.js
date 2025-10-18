(async function init() {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return;
  }
  const { data: prof, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) {
    console.error(error);
    return;
  }
  if (prof.role === "director") {
    window.location.href = "director/index.html";
  } else if (prof.role === "manager") {
    window.location.href = "manager/index.html";
  } else if (prof.role === "teacher") {
    window.location.href = "teachers/index.html";
  } else if (prof.role == "library") {
    window.location.href = "library/index.html";
  } else if (prof.role == "admin") {
    window.location.href = "admin/index.html";
  } else if (prof.role == "manager-teacher") {
    window.location.href = "manager-teacher/index.html";
  } else if (prof.role == "admin-teacher") {
    windows.location.href = "admin-teacher/index.html";
  }
})();
// Sign In
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const login = $("login").value.trim().toLowerCase();
  const password = $("password").value;

  if (!login || !password) {
    showAlert("Iltimos Login va Parolni Kiriting!", "err");
    return;
  }

  // Login bor-yo'qligini tekshirish
  const { data: profile, error: pfErr } = await sb
    .from("profiles")
    .select("*")
    .eq("login", login)
    .maybeSingle();

  if (pfErr) {
    showAlert(`Xatolik:${pfErr.message}`, "err");
    return;
  }
  if (!profile) {
    showAlert("Bu Foydalanuvchi Ro'yxatdan O'tmagan!", "err");
    return;
  }

  // Parolni tekshirish
  const email = emailFromLogin(login);
  const { error: siErr } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  if (siErr) {
    showAlert("Parol Xato!", "err");
    return;
  }
  $("password").value = "";
  if (profile.role === "director") {
    window.location.href = "director/index.html";
  } else if (profile.role === "manager") {
    window.location.href = "manager/index.html";
  } else if (profile.role === "teacher") {
    window.location.href = "teach/index.html";
  } else if (profile.role == "library") {
    window.location.href = "library/index.html";
  } else if (profile.role == "admin") {
    window.location.href = "admin/index.html";
  } else if (profile.role == "manager-teacher") {
    window.location.href = "manager-teacher/index.html";
  } else if (profile.role == "admin-teacher") {
    windows.location.href = "admin-teacher/index.html";
  }
});
