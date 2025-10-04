
//Real-Time
function startPresence() {
        channel = sb.channel("online-users", {
          config: { presence: { key: CURRENT_USER.id } },
        });

        channel.on("presence", { event: "sync" }, () => {
          presenceState = channel.presenceState();
          getInfo();
          getParents();
           getUnreadPreview(CURRENT_USER.id).then((p)=>{
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



 
//  Get Parents
async function getParents() {
        const { data, error } = await sb.from("parents").select(`
         id,
         first_name,
         last_name,
         middle_name,
         avatar_url,
         type,
         created_at,
         gender,
         birth_date,
         passport_serial,
         phone,
         email,
         student_parent(count)
       `);

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const parentsContainer = $("parentsContainer");
        parentsContainer.innerHTML = "";
        data.forEach((user,i) => {
          const childCount = user.student_parent[0]?.count || 0;
          parentsContainer.innerHTML += `
         <tr style="cursor: pointer;" onclick=getParentInfo("${user.id}")>
                                 <td>${i+1}</td>
                                 <td>
                                   <img src="${
                                     user.avatar_url ||
                                     "../../assets/images/jpg/user-icon.jpg"
                                   }" class="me-2" alt="image">${[
            user.first_name || "",
            user.last_name || "",
          ]
            .join(" ")
            .trim()}
                                 </td>
                                 <td> ${user.type || "-"} </td>
                                 <td> ${childCount} </td>
                                 <td> ${user.email || "-"} </td>
                                 <td> ${user.phone || "-"} </td>
      </tr>
         `;
        });
      }



//Get Parent Info
async function getParentInfo(userId) {
        $("wrapCont").classList.add("hidden");
        $("infoModal").classList.remove("hidden");
        const { data, error } = await sb
          .from("parents")
          .select(
            `
         id,
         first_name,
         last_name,
         middle_name,
         avatar_url,
         type,
         created_at,
         location,
         gender,
         birth_date,
         passport_serial,
         phone,
         email,
         student_parent(count)
       `
          )
          .eq("id", userId);

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const user = data[0];

        const childCount = user.student_parent[0]?.count || 0;
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
           user.first_name || '-'
         } disabled>
         <label class="form-label">Familya</label>
         <input type="text" class="form-control" placeholder=${
           user.last_name || '-'
         }  disabled>
       </div>
       <div class="col-md-4">
          <label class="form-label">Otasining Ismi</label>
         <input type="text" class="form-control"  placeholder=${
           user.middle_name || '-'
         }  disabled>
       </div>

        <div class="col-md-4">
         <label class="form-label">Tug'ilgan Sana</label>
         <input type="text" class="form-control" placeholder=${
           user.birth_date || '-'
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Jins</label>
         <input type="text" class="form-control"  placeholder=${
           user.gender || '-'
         }  disabled>
       </div>
        <div class="col-md-4">
         <label class="form-label">Turi</label>
         <input type="text" class="form-control"  placeholder=${
           user.type || '-'
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Passport Seriya</label>
         <input type="text" class="form-control"  placeholder=${
           user.passport_serial || '-'
         }  disabled>
       </div>
        <div class="col-md-4">
         <label class="form-label">Yashash Manzili</label>
         <input type="text" class="form-control"  placeholder=${
           user.location || '-'
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Telefon Raqam</label>
         <input type="text" class="form-control"  placeholder=${
           user.phone || '-'
         }  disabled>
       </div>
        <div class="col-md-4">
         <label class="form-label">Elektron Pochta</label>
         <input type="text" class="form-control"  placeholder=${
           user.email || '-'
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Bolalari</label>
         <input type="text" class="form-control"  placeholder=${childCount || '-'}  disabled>
         ${
           childCount > 0
             ? `<button onclick=getStudents("${user.id}") type="button" class="btn btn-success">Ko'rish</button>`
             : ""
         }
       </div>
         `;
      }




//Add Parent
$("addUserForm").addEventListener("submit", async (e) => {
        loader(true);
        e.preventDefault();
        const avatarFile = $("imgFile").files[0];
        let avatarUrl = await uploadAvatarB(avatarFile);
        const newParent = {
          first_name: document.getElementById("first_name").value,
          last_name: document.getElementById("last_name").value,
          middle_name: document.getElementById("middle_name").value,
          birth_date: document.getElementById("birth_date").value,
          gender: document.getElementById("gender").value,
          passport_serial: document.getElementById("passport_serial").value,
          type: document.getElementById("type").value,
          phone: "+998" + document.getElementById("tel").value,
          email: document.getElementById("email").value,
          location: document.getElementById("location").value,
          avatar_url: avatarUrl,
        };

        const { data: exists, error: checkError } = await sb
          .from("parents")
          .select("id")
          .or(`passport_serial.eq.${newParent.passport_serial}`);

        if (checkError) {
          showAlert(checkError.message,'err');
          return;
        }

        if (exists.length > 0) {
          showAlert(
            `Bu ${newParent.type}  ma'lumotlari allaqachon mavjud!`,
            "err"
          );
          loader(false);
          return;
        }

        const { error } = await sb.from("parents").insert([newParent]);
        if (error) return showAlert(error.message, "err");
        e.target.reset();
        loader(false);
        showAlert(
          `${newParent.type} Qo'shildi`,
          "success"
        );
        closeInfo();
        startPresence();
      });

// Get Parent Child

      async function getStudents(parentId) {
        $("infoModal2").classList.remove("hidden");
        $("infoModal").classList.add("hidden");
        const { data, error } = await sb
          .from("student_parent")
          .select(
            `
      students (
        id,
        first_name,
        last_name,
        middle_name,
        birth_date,
        gender,
        email,
        phone,
        passport_serial,
        sign_date,
        location,
        avatar_url,
        created_at,
        classes (
          name
        )
      )
    `
          )
          .eq("parent_id", parentId);

        if (error) {
          showAlert(error.message,'err');
          return [];
        }

        // students + class_name chiqaramiz
        const users = data.map((item) => ({
          ...item.students,
          class_name: item.students.classes?.name || null,
        }));

        $("infoCont2").innerHTML = "";

        users.forEach((user, i) => {
          $("infoCont2").innerHTML += `
           <tr style="cursor: pointer;" onclick=getChildInfo("${user.id}")>
                                 <td>${i+1}</td>
                                 <td>
                                   <img src="${
                                     user.avatar_url ||
                                     "../../assets/images/jpg/user-icon.jpg"
                                   }" class="me-2" alt="image">${[
            user.first_name || "",
            user.last_name || "",
          ]
            .join(" ")
            .trim()}
                                 </td>
                                 <td> ${user.class_name || "-"} </td>
                                 <td> ${user.sign_date} </td>
                                 <td> ${user.email || "-"} </td>
                                 <td> ${user.phone || "-"} </td>
      </tr>
          `;
        });
      }



//Get Chil Info

      async function getChildInfo(studentId) {
        $("infoModal2").classList.add("hidden");
        $("infoModal3").classList.remove("hidden");
        const { data, error } = await sb
          .from("students")
          .select(
            `
      id,
      first_name,
      last_name,
      middle_name,
      birth_date,
      gender,
      email,
      phone,
      location,
      passport_serial,
      avatar_url,
      classes ( name )
    `
          )
          .eq("id", studentId)
          .single(); // faqat bitta o‘quvchi chiqadi

        if (error) {
          showAlert(error.message,'err');
          return null;
        }

        const user = {
          ...data,
          class_name: data.classes?.name || null,
        };

        $("infoCont3").innerHTML = `
          <div class="col-md-2">
         <label class="form-label">Rasm</label>
         <img height="200" class="form-control" src="${
           user.avatar_url || "../../assets/images/jpg/user-icon.jpg"
         }">
       </div>

       <div class="col-md-4">
         <label class="form-label">Ism</label>
         <input type="text" class="form-control" placeholder=${
           user.first_name
         } disabled>
         <label class="form-label">Familya</label>
         <input type="text" class="form-control" placeholder=${
           user.last_name
         }  disabled>
       </div>
       <div class="col-md-4">
          <label class="form-label">Otasining Ismi</label>
         <input type="text" class="form-control"  placeholder=${
           user.middle_name
         }  disabled>
       </div>

        <div class="col-md-4">
         <label class="form-label">Tug'ilgan Sana</label>
         <input type="text" class="form-control" placeholder=${
           user.birth_date
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Jins</label>
         <input type="text" class="form-control"  placeholder=${
           user.gender
         }  disabled>
       </div>
        <div class="col-md-4">
         <label class="form-label">Sinf</label>
         <input type="text" class="form-control"  placeholder=${
           user.class_name
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Passport Seriya</label>
         <input type="text" class="form-control"  placeholder=${
           user.passport_serial
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Yashash Manzili</label>
         <input type="text" class="form-control"  placeholder=${
           user.location
         }  disabled>
       </div>
       <div class="col-md-4">
         <label class="form-label">Telefon Raqam</label>
         <input type="text" class="form-control"  placeholder=${
           user.phone
         }  disabled>
       </div>
        <div class="col-md-4">
         <label class="form-label">Elektran Pochta</label>
         <input type="text" class="form-control"  placeholder=${
           user.email
         }  disabled>
       </div>
         `;
      }


//Upload image for Supa Base Bucket "avatars"
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


//ShowAlert
      function showAlert(text, type) {
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(
          $("liveToast")
        );
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





      $("showAddUserForm").addEventListener("click", () => {
        $("wrapCont").classList.add("hidden");
        $("addUserFormModal").classList.remove("hidden");
      });

      $("closeAddUserForm").addEventListener("click", () => {
        $("addUserFormModal").classList.add("hidden");
        $("wrapCont").classList.remove("hidden");
      });

      $("closeEditUserForm").addEventListener("click", () => {
        closeInfo();
      });

      function closeInfo() {
        $("wrapCont").classList.remove("hidden");
        $("infoModal").classList.add("hidden");
        $("infoModal2").classList.add("hidden");
        $("infoModal3").classList.add("hidden");
        $("addUserFormModal").classList.add("hidden");
        $("editUserFormModal").classList.add("hidden");
      }

   