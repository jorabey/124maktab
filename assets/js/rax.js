
// 📌 Manager va Director bo'lgan userlarni olish funksiyasi
async function getManagersAndDirectors() {
  try {
    const { data, error } = await sb
      .from("profiles")
      .select("id, first_name, last_name, role,position,avatar_url,email,phone")
      .in("role", ["manager", "director"]); // faqat shu rollarni olamiz

    if (error) throw error;

    return data; // userlar ro'yxati
  } catch (err) {
    console.error("❌ getManagersAndDirectors error:", err.message);
    return [];
  }
}



async function updateRax(){
  const rax = await getManagersAndDirectors()
  $('raxList').innerHTML = ''
  rax.forEach((item,i)=>{
    $('raxList').innerHTML += `
    <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay=${i == 0?'0.1':i == 1?'0.3':i == 2?'0.5':'0.7'}>
                    <div class="team-item position-relative">
                        <div class="position-relative">
                            <img class="img-fluid" src=${item.avatar_url || 'img/team-2.jpg'} alt="">
                            <div class="team-social text-center">
                                <a class="btn btn-square btn-outline-primary border-2 m-1" href="mailto:${item.email}"><i class="fa fa-envelope"></i></a>
                                <a class="btn btn-square btn-outline-primary border-2 m-1" href="tel:${item.phone}"><i class="fa fa-phone"></i></a>
                            </div>
                        </div>
                        <div class="bg-light text-center p-4">
                            <h5 class="mt-2">${item.first_name} ${item.last_name}</h5>
                            <span>${item.position}</span>
                        </div>
                    </div>
                </div>
    `
  })
}

updateRax()


function currentPage(){
  current = window.location.href;
  const prev = sessionStorage.getItem('currentURL');
  if (prev && prev !== current) {
    sessionStorage.setItem('previosURL',prev);
  }

  sessionStorage.setItem('currentURL',current)
}

function getPreviousURL(){
  const saved = sessionStorage.getItem('previosURL');
  if (saved) return saved;

  if (document.referrar && document.referrar !== window.location.href) {
    return document.referrar
  }

  return null
}


function setPage(){
  const prev = getPreviousURL();
  if (prev) {
     $('prevPage').classList.remove('hidden')
    $('prevPage').href = prev
  }else{
    $('prevPage').classList.add('hidden')
  }
}

setPage()
currentPage()