//User
let CURRENT_USER = null;
let CURRENT_PROFILE = null;
let presenceState = {};

//Get User Info
getUserInfo();

//Loader
function loader(togle) {
  if (togle) {
    $("loader").classList.remove("hidden");
  } else {
    $("loader").classList.add("hidden");
  }
}

//Check User Adn Get User Info
async function getUserInfo() {
  loader(true);
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    window.location.href = "../../login.html";
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

  CURRENT_PROFILE = prof || null;
  CURRENT_USER = user;
  if (CURRENT_PROFILE.role == 'teacher') {
    await init()
    startPresence()
  }else{
    window.location.href = "../login.html";
    return;
  }
  loader(false)
}

//LogOut
async function logOut() {
  loader(true);
  await sb.auth.signOut();
  window.location.href = "../../login.html";
}

//windows Loader True
window.onload = function () {
  loader(true);
};



