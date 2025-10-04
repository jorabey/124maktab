
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