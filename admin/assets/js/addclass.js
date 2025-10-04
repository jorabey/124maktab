//Real-Time
 function startPresence() {
        channel = sb.channel("online-users", {
          config: { presence: { key: CURRENT_USER.id } },
        });

        channel.on("presence", { event: "sync" }, () => {
          presenceState = channel.presenceState();
          getInfo();
          getClass();
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





//Get Classes
 async function getClass() {
        const { data, error } = await sb
          .from("classes")
          .select(
            "id, name, teachers ( profiles ( first_name, last_name ) ), students(id)"
          );

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const classContainer = $("classContainer");
        classContainer.innerHTML = "";
        data.forEach((user,i) => {
          classContainer.innerHTML += `
           <tr style="cursor: pointer;" onclick=getClassInfo("${user.id}")>
                                   <td>${i+1}</td>
                                   <td>${user.name}</td>
                                   <td> ${user.students.length || "-"} </td>
                                    <td> ${
                                      user.teachers?.profiles?.first_name || ""
                                    }  ${
            user.teachers?.profiles?.last_name || ""
          }</td>
        </tr>
           `;
        });
      }



//Get Class Info

     
      async function getClassInfo(userId) {
        $("wrapCont").classList.add("hidden");
        $("infoModal").classList.remove("hidden");
        const { data, error } = await sb
          .from("classes")
          .select(
            "id, name,teacher_id, teachers ( profiles ( first_name, last_name ) ), students(id)"
          )
          .eq("id", userId);

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const user = data[0];
        $("infoCont").innerHTML = `
         <div class="col-md-4">
           <label class="form-label">Sinf Nomi</label>
           <input type="text" class="form-control" placeholder=${
             user.name
           } disabled>
          </div>
         <div class="col-md-4">
            <label class="form-label">Sinf Rahbar</label>
           <input type="text" class="form-control"  placeholder=${
             user.teachers.profiles.first_name
           }.${user.teachers.profiles.last_name}  disabled>
         </div>

          <div class="col-md-4">
           <label class="form-label">Sinfdagi O'quvchilar Soni</label>
           <input type="text" class="form-control" placeholder=${
             user.students.length || "-"
           }  disabled>
         </div>
           <button style='margin-right: 20px;' onclick=editUser("${user.id}","${
          user.teacher_id
        }") type="button" class="col-3 btn btn-success">Tahrirlash</button>
           <button onclick=deleteUser("${
             user.id
           }") type="button" class="col-3 btn btn-danger">O'chirish</button>
         </div>
           `;
      }


//Add Class
 $("addUserForm").addEventListener("submit", async (e) => {
        loader(true);
        e.preventDefault();
        const newClass = {
          name: document.getElementById("class_name").value,
          teacher_id: document.getElementById("class_teacher").value,
        };

        if (!$("class_teacher").value) {
          showAlert("Iltimos Sinf Rahbar tanlang", "err");
          loader(false);
          return;
        }

        if (!$("class_name").value) {
          showAlert("Iltimos Sinf Nomini Kiriting", "err");
          loader(false);
          return;
        }

        const exist = await isClassNameExists($("class_name").value);

        if (exist) {
          showAlert("Bu Sinf mavjud!", "err");
          loader(false);
          return;
        }

        const { error } = await sb.from("classes").insert([newClass]);

        if (error) {
          alert("Xato: " + error.message);
          loader(false);
          return;
        }
        e.target.reset();
        loader(false);
        showAlert(`Yangi Sinf Qo'shildi`, "success");
        closeInfo();
        startPresence();
      });



//Edit Class
 async function setInfo(userId) {
        const { data, error } = await sb
          .from("classes")
          .select(
            "id, name,teacher_id, teachers ( profiles ( first_name, last_name ) ), students(id)"
          )
          .eq("id", userId);

        if (error) {
          showAlert(error.message, "err");
          return;
        }

        const user = data[0];
        $("class_name2").value = user.name;
        $("class_teacher2").value = user.teacher_id;
        return {className:user.name}
      }

      async function editUser(userId, teach) {
        $("editUserFormModal").classList.remove("hidden");
        $("infoModal").classList.add("hidden");
        loadTeachers2(teach);
        const  oldUser = setInfo(userId);
        $("editUserForm").addEventListener("submit", async (e) => {
          loader(true);
          e.preventDefault();
          const className = $("class_name2").value.trim();
          const classTeacher = $("class_teacher2").value.trim();

          const updatedData = {
            name: className,
            teacher_id: classTeacher,
          };

          if (!className) {
            showAlert("Iltimos Sinf Nomini Kiriting", "err");
            loader(false);
            return;
          }

          if (!classTeacher) {
            showAlert("Iltimos Sinf Rahbar tanlang", "err");
            loader(false);
            return;
          }

          if (!oldUser.className == updatedData.name) {
            const exist = await isClassNameExists(className);

            if (exist) {
              showAlert("Bu Sinf mavjud!", "err");
              loader(false);
              return;
            }
          }

          const { error } = await sb
            .from("classes")
            .update(updatedData)
            .eq("id", userId);

          if (error) {
            showAlert(error.message, "err");
            return;
          }

          loader(false);
          showAlert(`Sinf  ma’lumotlari yangilandi`, "success");
          closeInfo();
          startPresence();
        });
      }


//Delete Class
      async function deleteUser(id) {
        if (!confirm("Haqiqatan ham o‘chirmoqchimisiz?")) return;

        const { error } = await sb.from("classes").delete().eq("id", id);
        if (error) {
          if (
            (error.messager =
              'update or delete on table "classes" violates foreign key constraint "students_class_id_fkey" on table "students"')
          ) {
            showAlert("Bu Sinfga O'quvchilar biriktirilgan", "err");
            return;
          }
          showAlert(error.message, "err");
          return;
        }

        loader(false);
        showAlert(`Sinf  O'chirildi`, "success");
        closeInfo();
        startPresence();
      }



//Show Alert

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
        loadTeachers();
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
        $("addUserFormModal").classList.add("hidden");
        $("editUserFormModal").classList.add("hidden");
      }

     

// Class Name check
      async function isClassNameExists(name) {
        const { data, error } = await sb
          .from("classes")
          .select("id")
          .eq("name", name)
          .maybeSingle(); // faqat 1 ta qaytaradi yoki null

        if (error) {
          showAlert(error.message,'err');
          return false;
        }

        return !!data; // agar data null emas bo‘lsa true qaytadi
      }



// load teacher for AddUserForm
      async function loadTeachers() {
        $("class_teacher").innerHTML =
          '<option value="">Sinf Rahbar tanlang</option>';
        const { data, error } = await sb
          .from("teachers")
          .select("id, profiles ( first_name, last_name )");

        if (error) {
          showAlert(error.message,'err');
          return;
        }

        const { data: classes } = await sb.from("classes").select("teacher_id");

        const usedTeachers = classes.map((c) => c.teacher_id);

        data.forEach((t) => {
          const fullName = `${t.profiles.first_name} ${t.profiles.last_name}`;
          const option = document.createElement("option");
          option.value = t.id;
          option.textContent = `${fullName}`;

          if (usedTeachers.includes(t.id)) {
            option.disabled = true;
            option.textContent += " (Sinf Rahbar Bo'lgan)";
          }

          $("class_teacher").appendChild(option);
        });
      }


//load User For EditUserForm
      async function loadTeachers2(teach) {
        $("class_teacher2").innerHTML =
          '<option value="">Sinf Rahbar tanlang</option>';
        const { data, error } = await sb
          .from("teachers")
          .select("id, profiles ( first_name, last_name )");

        if (error) {
          console.error(error);
          return;
        }

        const { data: classes } = await sb.from("classes").select("teacher_id");

        const usedTeachers = classes.map((c) => c.teacher_id);

        data.forEach((t) => {
          const fullName = `${t.profiles.first_name} ${t.profiles.last_name}`;
          const option = document.createElement("option");
          option.value = t.id;
          option.textContent = `${fullName}`;

          if (usedTeachers.includes(t.id)) {
            option.disabled = true;
          }

          if (t.id == teach) {
            option.disabled = false;
            option.selected = true;
          }

          $("class_teacher2").appendChild(option);
        });
      }

     