
  // DOM
  const classFilter = document.getElementById('classFilter');
  const booksGrid = document.getElementById('booksGrid');
  const btnAdd = document.getElementById('btnAdd');
  const btnRefresh = document.getElementById('btnRefresh');
  const qSearch = document.getElementById('qSearch');
  const modalRoot = document.getElementById('modalRoot');

  let classesCache = [];
  let booksCache = [];

  // init
  (async function init(){
    attachHandlers();
    await loadClasses();
    await loadBooks();
  })();

  function attachHandlers(){
    classFilter.addEventListener('change', ()=> loadBooks());
    btnRefresh.addEventListener('click', ()=> loadBooks());
    qSearch.addEventListener('input', debounce(()=> loadBooks(), 300));
  }

  function debounce(fn, delay=250){
    let t;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
  }

  // Load classes for filter
  async function loadClasses(){
    try{
      const { data, error } = await sb.from('classes').select('id, name').order('name');
      if(error) throw error;
      classesCache = data || [];
      populateClassFilter();
    } catch(err){
      console.error('Classes load err', err);
      alert('Classes load error: ' + (err.message||err));
    }
  }

  function populateClassFilter(){
    classFilter.innerHTML = '<option value="all">Barchasi</option>';
    classesCache.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      classFilter.appendChild(opt);
    });
  }

  // Load books (optionally filtered)
  async function loadBooks(){
    booksGrid.innerHTML = 'Yuklanmoqda...';
    const classId = classFilter.value;
    const q = qSearch.value.trim();

    try{
      let query = sb.from('books').select(`
        id,
        title,
        author,
        description,
        file_url,
        class_id,
        created_at,
        classes(name)
      `).order('created_at', {ascending:false});

      if(classId && classId !== 'all') query = query.eq('class_id', classId);
      if(q) {
        // simple ilike search on title or author
        query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if(error) throw error;
      booksCache = data || [];
      renderBooks();
    } catch(err){
      console.error('Books load err', err);
      booksGrid.innerHTML = '<div class="empty">Kitoblarni olishda xatolik: '+(err.message||err)+'</div>';
    }
  }

  // Render grid
  function renderBooks(){
    booksGrid.innerHTML = '';
    if(!booksCache || booksCache.length === 0){
      booksGrid.innerHTML = '<div class="empty">Hech qanday kitob topilmadi.</div>';
      return;
    }

    booksCache.forEach(b=>{
      const card = document.createElement('div'); card.className='card fade-in';

      // cover preview (if file_url is pdf/docx, show icon; if image show preview)
      const cover = document.createElement('div'); cover.className='cover';
      if(b.file_url){
        const low = b.file_url.toLowerCase();
        if(low.endsWith('.pdf')) cover.innerHTML = 'PDF';
        else if(low.endsWith('.docx')||low.endsWith('.doc')) cover.innerHTML = 'DOC';
        else if(/\.(jpg|jpeg|png|gif|webp)$/.test(low)) {
          const img = document.createElement('img'); img.src = b.file_url; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='cover'; img.style.borderRadius='6px';
          cover.innerHTML=''; cover.appendChild(img);
        } else cover.innerHTML = 'FILE';
      } else cover.innerHTML = 'No file';

      const meta = document.createElement('div'); meta.className='meta';
      const info = document.createElement('div'); info.className='info';
      const title = document.createElement('h3'); title.textContent = b.title || '—';
      const pmeta = document.createElement('p'); pmeta.className='small-muted';
      pmeta.textContent = `${b.author || '-'} - ${b.classes?.name || 'Barchasi'}`;

      info.appendChild(title); info.appendChild(pmeta);
      const actions = document.createElement('div'); actions.className='actions';

      // download link (if file_url)
      if(b.file_url){
        const a = document.createElement('a'); a.className='btn btn-primary'; a.href=b.file_url; a.target='_blank'; a.rel='noopener';
        a.textContent = 'Yuklab olish';
        actions.appendChild(a);
      }

      meta.appendChild(info); meta.appendChild(actions);

      card.appendChild(cover); card.appendChild(meta);

      // description
      if(b.description){
        const desc = document.createElement('div'); desc.style.color='var(--muted)'; desc.style.fontSize='13px'; desc.textContent=b.description;
        card.appendChild(desc);
      }

      booksGrid.appendChild(card);
    });
  }

  // helpers
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
  function sanitizeFilename(name){
    return name.replace(/[^a-zA-Z0-9\-\._]/g,'_');
  }
