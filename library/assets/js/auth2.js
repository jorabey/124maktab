//User
let CURRENT_USER = null;
let CURRENT_PROFILE = null;
let presenceState = {};

//Get User Info
getUserInfo();

//Send Request
$("refreshBtn").addEventListener("click", () => {
  getUserInfo();
});

//Get Real-Time Messages
function subscribeToNewMessages(id) {
  sb.channel("realtime-messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${id}`, // faqat shu userga kelgan xabarlar
      },
      (payload) => {
        getUnreadPreview(id).then((p) => {
          showMessage(p);
        });
      }
    )
    .subscribe();
}

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
  if (CURRENT_PROFILE.role == "library") {
    startPresence();
    subscribeToNewMessages(CURRENT_USER.id);
    await getInfo();
  } else {
    window.location.href = "../login.html";
    return;
  }
  loader(false);
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

//Get Info User and Set
async function getInfo() {
  const fullName = [CURRENT_PROFILE?.first_name, CURRENT_PROFILE?.last_name]
    .filter(Boolean)
    .join(" ");
  const role = CURRENT_PROFILE?.role || "user";
  const img =
    CURRENT_PROFILE?.avatar_url || "../assets/images/jpg/user-icon.jpg";
  const onlineIds = Object.keys(presenceState);
  const isOnline = onlineIds.includes(CURRENT_PROFILE.id);
  if (isOnline) {
    $("onlineStatus1").classList.remove("offline");
    $("onlineStatus1").classList.add("online");
    $("onlineStatus2").classList.remove("offline");
    $("onlineStatus2").classList.add("online");
  } else {
    $("onlineStatus1").classList.add("offline");
    $("onlineStatus1").classList.remove("online");
    $("onlineStatus2").classList.add("offline");
    $("onlineStatus2").classList.remove("online");
  }

  $("userFullName1").textContent = fullName;
  $("userFullName2").textContent = fullName;
  $("userImg1").src = img;
  $("userImg2").src = img;
  $("userRole").textContent = role;
}
