//Real-Time
 function startPresence() {
        channel = sb.channel("online-users", {
          config: { presence: { key: CURRENT_USER.id } },
        });

        channel.on("presence", { event: "sync" }, () => {
          presenceState = channel.presenceState();
          getInfo();
          getStudents();
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




//Get Students

      async function getStudents() {
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
            passport_serial,
            location,
            sign_date,
            avatar_url,
            email,
            phone,
            classes ( name ),
            student_parent (
              parent_id,
              parents ( first_name, last_name )
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const studetsContainer = $("studentsContainer");
        studentsContainer.innerHTML = "";
        data.forEach((user,i) => {
          studentsContainer.innerHTML += `
           <tr style="cursor: pointer;" onclick=getStudentInfo("${user.id}")>
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
                                   <td> ${user.classes.name || "-"} </td>
                                   <td> ${escapeHtml(
                                     user.sign_date || "-"
                                   )} </td>
                                   <td> ${user.email || "-"} </td>
                                   <td> ${user.phone || "-"} </td>
        </tr>
           `;
        });
      }



//Get Student Info
    async function getStudentInfo(userId) {
        $("wrapCont").classList.add("hidden");
        $("infoModal").classList.remove("hidden");
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
          passport_serial,
          location,
          sign_date,
          phone,
          avatar_url,
          created_at,
          classes (
            name
          )
        )
      `
          )
          .eq("student_id", userId);

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const users = data.map((item) => ({
          ...item.students,
          class_name: item.students.classes?.name || null,
        }));
        const user = users[0];
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
           <label class="form-label">Telefon Raqam</label>
           <input type="text" class="form-control"  placeholder=${
             user.phone
           }  disabled>
         </div>
          <div class="col-md-4">
           <label class="form-label">Elektron Pochta</label>
           <input type="text" class="form-control"  placeholder=${
             user.email
           }  disabled>
         </div>
         <div class="col-md-4">
           <label class="form-label">Yashash Joyi</label>
           <input type="text" class="form-control"  placeholder=${
             user.location
           }  disabled>
         </div>
          <div class="col-md-4">
           <label class="form-label">Maktabga Qabul qilingan sana</label>
           <input type="text" class="form-control"  placeholder=${escapeHtml(
             user.sign_date || "-"
           )}  disabled>
         </div>
         <div class="col-12">
           <button onclick=editUser("${
             user.id
           }") type="button" class="btn btn-success">Tahrirlash</button>
           <button onclick=deleteUser("${
             user.id
           }") type="button" class="btn btn-danger">O'chirish</button>
         </div>
           `;
      }




//Add Student

      $("addUserForm").addEventListener("submit", async (e) => {
        loader(true);
        e.preventDefault();
        const avatarFile = $("imgFile").files[0];
        let avatarUrl = await uploadAvatarB(avatarFile);
        const newStudent = {
          first_name: document.getElementById("first_name").value,
          last_name: document.getElementById("last_name").value,
          middle_name: document.getElementById("middle_name").value,
          birth_date: document.getElementById("birth_date").value,
          gender: document.getElementById("gender").value,
          passport_serial: document.getElementById("passport_serial").value,
          phone: "+998" + document.getElementById("tel").value,
          location: document.getElementById("location").value,
          sign_date: document.getElementById("sign_date").value,
          email: document.getElementById("email").value,
          class_id: $("class").value,
          avatar_url: avatarUrl,
        };

        const parentId = $("parentType").value;

        if (!$("parentType").value) {
          showAlert("Iltimos Ota-Ona(vasiy) tanlang", "err");
          loader(false);
          return;
        }

        if (!$("class").value) {
          showAlert("Iltimos Sinf tanlang", "err");
          loader(false);
          return;
        }

        const { data: exists, error: checkError } = await sb
          .from("students")
          .select("id")
          .or(`passport_serial.eq.${newStudent.passport_serial}`);

        if (checkError) {
          showAlert(checkError.message);
          return;
        }

        if (exists.length > 0) {
          showAlert(`Bu O'quvchi  ma'lumotlari allaqachon mavjud!`, "err");
          loader(false);
          return;
        }

        const { data, error } = await sb
          .from("students")
          .insert([newStudent])
          .select()
          .single();
        const newId = data.id;
        await sb
          .from("student_parent")
          .insert([{ student_id: newId, parent_id: parentId }]);

        if (error) return showAlert(error.message, "err");
        e.target.reset();
        loader(false);
        showAlert(`O'quvchi Qo'shildi`, "success");
        closeInfo();
        startPresence();
      });


//Edit Student

      async function setInfo(userId) {
        const { data, error } = await sb
          .from("students")
          .select(
            `
          id, first_name, last_name, middle_name,email,phone, birth_date, gender, passport_serial, class_id, location, sign_date, avatar_url
        `
          )
          .eq("id", userId)
          .single();
        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const av = null;
        const pas = null;
        const { data: spData } = await sb
          .from("student_parent")
          .select("parent_id")
          .eq("student_id", userId)
          .limit(1);
        if (spData && spData.length > 0) {
          const user = data;
          ($("first_name2").value = user.first_name);
          ($("last_name2").value = user.last_name);
          ($("tel2").value = user.phone);
          ($("class2").value = user.class_id);
          ($("passport_serial2").value = user.passport_serial);
          ($("middle_name2").value = user.middle_name);
          ($("gender2").value = user.gender);
          ($("birth_date2").value = user.birth_date); // YYYY-MM-DD yoki null
          ($("email2").value = user.email);
          ($("location2").value = user.location);
          ($("sign_date2").value = user.sign_date);
          ($("parentType2").value = spData[0].parent_id);
          localStorage.setItem("avatarUF", user.avatar_url);
          localStorage.setItem("passport", user.passport_serial);
          av = user.avatar_url;
          pas = user.passport_serial
        }

        return {passport:pas,avatar:av}
      }

      async function editUser(userId) {
        $("editUserFormModal").classList.remove("hidden");
        $("infoModal").classList.add("hidden");
        await loadParents2();
        await loadClasses2();
        const oldUser = await setInfo(userId);
        $("editUserForm").addEventListener("submit", async (e) => {
          loader(true);
          e.preventDefault();
          const first = $("first_name2").value.trim();
          const last = $("last_name2").value.trim();
          const phone = $("tel2").value.trim();
          const location = $("location2").value.trim();
          const passport_serial = $("passport_serial2").value.trim();
          const midl = $("middle_name2").value.trim();
          const gender = $("gender2").value || null;
          const classes = $("class2").value || null;
          const birth = $("birth_date2").value || null; // YYYY-MM-DD yoki null
          const avatarFile = $("imgFile2").files[0];
          const email = $("email2").value.trim();
          const sign_date = $("sign_date2").value.trim();
          const parentId = $("parentType2").value;
          let avatarUrl = await uploadAvatarB(avatarFile);


          const updatedData = {
            avatar_url: avatarUrl ? avatarUrl : oldUser.avatar,
            first_name: first,
            last_name: last,
            middle_name: midl,
            birth_date: birth,
            gender: gender,
            phone: phone,
            location: location,
            sign_date: sign_date,
            class_id: classes,
            passport_serial: passport_serial,
            email: email,
          };

          if (!$("parentType2").value) {
            showAlert("Iltimos Ota-Ona(vasiy) tanlang", "err");
            loader(false);
            return;
          }

          if (!$("class2").value) {
            showAlert("Iltimos Sinf tanlang", "err");
            loader(false);
            return;
          }

          const passLoc = localStorage.getItem("passport");
          if (!updatedData.passport_serial == oldUser.passport_serial) {
            const { data: exists, error: checkError } = await sb
              .from("students")
              .select("id")
              .or(`passport_serial.eq.${updatedData.passport_serial}`);

            if (checkError) {
              showAlert(checkError.message);
              return;
            }

            if (exists.length > 0) {
              showAlert(`Bu O'quvchi  ma'lumotlari allaqachon mavjud!`, "err");
              loader(false);
              return;
            }
          }

          const { error } = await sb
            .from("students")
            .update(updatedData)
            .eq("id", userId);

          if (error) {
            showAlert(error.message, "err");
            return;
          }

          await sb
            .from("student_parent")
            .update({ parent_id: parentId })
            .eq("student_id", userId);

          loader(false);
          showAlert(`O'quvchi  ma’lumotlari yangilandi`, "success");
          closeInfo();
          startPresence();
        });
      }


//Delete Student
  async function deleteUser(id) {
        if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
        try {
          // delete student_parent first
          const { error: del1 } = await sb
            .from("student_parent")
            .delete()
            .eq("student_id", id);
          if (del1) throw showAlert(del1.message, "err");
          const { error: del2 } = await sb
            .from("students")
            .delete()
            .eq("id", id);
          if (del2) throw showAlert(del2.message, "err");
          loader(false);
          showAlert(`ma’lumotlar o'chirildi`, "success");
          closeInfo();
          startPresence();
        } catch (err) {
          showAlert(err.message, "err");
          alert("O'chirishda xato: " + (err?.message || ""));
        }
      }









//Upload Image For Supa Base Bucket "avatars"
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




      $("showAddUserForm").addEventListener("click", () => {
        $("wrapCont").classList.add("hidden");
        $("addUserFormModal").classList.remove("hidden");
        loadParents();
        loadClasses();
      });

      $("closeAddUserForm").addEventListener("click", () => {
        $("addUserFormModal").classList.add("hidden");
        $("wrapCont").classList.remove("hidden");
      });

      $("closeAddUserForm").addEventListener("click", () => {
        closeInfo();
      });

      function closeInfo() {
        $("wrapCont").classList.remove("hidden");
        $("infoModal").classList.add("hidden");
        $("addUserFormModal").classList.add("hidden");
        $("editUserFormModal").classList.add("hidden");
      }

     


      // --- helper sanitize
      function escapeHtml(text) {
        if (!text) return "";
        return String(text)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }

  
      async function loadParents() {
        const parentSelect = $("parentType");
        parentSelect.innerHTML = '<option value="">Ota-ona tanlang</option>';
        const { data, error } = await sb
          .from("parents")
          .select("id, first_name, last_name, type")
          .order("first_name");
        if (error) {
          showAlert(error.message, "err");
          return;
        }
        data.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.first_name} ${p.last_name} (${p.type || "—"})`;
          parentSelect.appendChild(opt);
        });
      }

      async function loadClasses() {
        const classSelect = $("class");
        classSelect.innerHTML = '<option value="">Sinf tanlang</option>';
        const { data, error } = await sb
          .from("classes")
          .select("id, name")
          .order("name");
        if (error) {
          console.error("classes yuklash:", error);
          return;
        }
        data.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = c.name;
          classSelect.appendChild(opt);
        });
      }

      async function loadParents2() {
        const parentSelect2 = $("parentType2");
        parentSelect2.innerHTML = '<option value="">Ota-ona tanlang</option>';
        const { data, error } = await sb
          .from("parents")
          .select("id, first_name, last_name, type")
          .order("first_name");
        if (error) {
          showAlert(error.message, "err");
          return;
        }
        data.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.first_name} ${p.last_name} (${p.type || "—"})`;
          parentSelect2.appendChild(opt);
        });
      }

      async function loadClasses2() {
        const classSelect2 = $("class2");
        classSelect2.innerHTML = '<option value="">Sinf tanlang</option>';
        const { data, error } = await sb
          .from("classes")
          .select("id, name")
          .order("name");
        if (error) {
          console.error("classes yuklash:", error);
          return;
        }
        data.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = c.name;
          classSelect2.appendChild(opt);
        });
      }