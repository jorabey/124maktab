async function renderNavbar(){
  const nav =  $('ui-navaber')
  const fullName = [CURRENT_PROFILE?.first_name, CURRENT_PROFILE?.last_name].filter(Boolean).join(" ")
  const role = (CURRENT_PROFILE?.role || "").toLowerCase();
  const img = (CURRENT_PROFILE?.avatar_url || "assets/images/jpg/user-icon.jpg")

  nav.innerHTML = `
  <li class="nav-item nav-profile">
              <a href="#" class="nav-link">
                <div class="nav-profile-image">
                  <img src=${img} alt="profile" />
                  <span class="login-status online"></span>
                  <!--change to offline or busy as needed-->
                </div>
                <div class="nav-profile-text d-flex flex-column">
                  <span class="font-weight-bold mb-2">${fullName}</span>
                  <span class="text-secondary text-small">${role}</span>
                </div>
                <i class="mdi mdi-bookmark-check text-success nav-profile-badge"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="../../index.html">
                <span class="menu-title">Boshqaruv Paneli</span>
                <i class="mdi mdi-home menu-icon"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" data-bs-toggle="collapse" href="#school" aria-expanded="false" aria-controls="icons">
                <span class="menu-title">Maktab</span>
                <i class="menu-arrow"></i>
                <i class="fa fa-bank menu-icon"></i>
              </a>
              <div class="collapse" id="school">
                <ul class="nav flex-column sub-menu">
                  <li class="nav-item">
                    <a class="nav-link" href="../../pages/school/rax.html">Maktab Raxbaryati</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="../../pages/school/teachers.html">O'qituvchilar</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="../../pages/school/otherusers.html">Boshqa Hodimlar</a>
                  </li>
                  <li class="nav-item" style=${role == 'director' || role == 'admin'?'':"display:none"}>
                    <a class="nav-link" href="pages/school/adduser.html">Hodim Qo'shish</a>
                  </li>
                  <li class="nav-item" style=${role == 'director' || role == 'admin' || role == 'manager'?'':"display:none"}>
                    <a class="nav-link" href="pages/school/parents.html">Ota-Onalar</a>
                  </li>
                  <li class="nav-item" style=${role == 'director' || role == 'admin' || role == 'manager'?'':"display:none"}>
                    <a class="nav-link" href="pages/school/addstudent.html">O'quvchi Qo'shish</a>
                  </li>
                  <li class="nav-item" style=${role == 'director' || role == 'admin'?'':"display:none"}>
                    <a class="nav-link" href="pages/school/addclass.html">Sinf Qo'shish</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/school/schoolinfo.html">Maktab Nizomi</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/school/doc.html">Hujjatlar</a>
                  </li>
                </ul>
              </div>
            </li>
            <li class="nav-item">
              <a class="nav-link" data-bs-toggle="collapse" href="#sinf" aria-expanded="false" aria-controls="icons">
                <span class="menu-title">O'quvchilar</span>
                <i class="menu-arrow"></i>
                <i class="fa fa-users menu-icon"></i>
              </a>
              <div class="collapse" id="sinf">
                <ul class="nav flex-column sub-menu">
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/1sinf.html">1-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/2sinf.html">2-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/3sinf.html">3-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/4sinf.html">4-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/5sinf.html">5-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/6sinf.html">6-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/7sinf.html">7-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/8sinf.html">8-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/9sinf.html">9-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/10sinf.html">10-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/student/11sinf.html">11-sinf</a>
                  </li>

                </ul>
              </div>
            </li>
            <li class="nav-item">
              <a class="nav-link" data-bs-toggle="collapse" href="#news" aria-expanded="false" aria-controls="ui-basic">
                <span class="menu-title">Yangiliklar</span>
                <i class="menu-arrow"></i>
                <i class="fa fa-bullhorn menu-icon"></i>
              </a>
              <div class="collapse" id="news">
                <ul class="nav flex-column sub-menu">
                  <li class="nav-item">
                    <a class="nav-link" href="pages/news/event.html">Tadbirlar</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/news/elon.html">Elonlar</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/news/win.html">Yutuqlarimiz</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/news/addnews.html">Yangilik qo'shish</a>
                  </li>
                </ul>
              </div>
            </li>
            <li class="nav-item" style=${role == 'director' || role == 'admin' || role == 'library'?'':"display:none"}>
              <a class="nav-link" data-bs-toggle="collapse" href="#library" aria-expanded="false" aria-controls="icons">
                <span class="menu-title">Kutubxona</span>
                <i class="menu-arrow"></i>
                <i class="fa fa-book menu-icon"></i>
              </a>
              <div class="collapse" id="library">
                <ul class="nav flex-column sub-menu">
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/allbook.html">Barch Kitoblar</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/1sinfb.html">1-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/2sinfb.html">2-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/3sinfb.html">3-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/4sinfb.html">4-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/5sinfb.html">5-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/6sinfb.html">6-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/7sinfb.html">7-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/8sinfb.html">8-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/9sinfb.html">9-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/10sinfb.html">10-sinf</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="pages/library/11sinfb.html">11-sinf</a>
                  </li>
                </ul>
              </div>
            </li>
             <li class="nav-item">
              <a class="nav-link" href="pages/messages.html">
                <span class="menu-title">Xabarlar</span>
                <i class="mdi mdi-message menu-icon"></i>
              </a>
            </li>
             <li class="nav-item">
              <a class="nav-link" href="pages/notif.html">
                <span class="menu-title">Bildirishnomalar</span>
                <i class="fa fa-bell menu-icon"></i>
              </a>
            </li>
             <li class="nav-item">
              <a class="nav-link" href="pages/settings.html">
                <span class="menu-title">Sozlamlar</span>
                <i class="fa fa-gear menu-icon"></i>
              </a>
            </li>
  `
}
