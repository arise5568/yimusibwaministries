document.addEventListener('DOMContentLoaded', function(){
  // Elements
  const loginForm = document.getElementById('loginForm');
  const adminLogin = document.getElementById('admin-login');
  const adminDashboard = document.getElementById('admin-dashboard');
  const logoutBtn = document.getElementById('logoutBtn');
  const tabEdit = document.getElementById('tabEdit');
  const tabSubs = document.getElementById('tabSubs');
  const editPane = document.getElementById('editPane');
  const subsPane = document.getElementById('subsPane');
  const pageSelect = document.getElementById('pageSelect');
  const pageEditor = document.getElementById('pageEditor');
  const saveLocal = document.getElementById('saveLocal');
  const previewBtn = document.getElementById('previewBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const applyBtn = document.getElementById('applyBtn');
  const subsList = document.getElementById('subsList');
  const subsSearch = document.getElementById('subsSearch');
  const refreshSubs = document.getElementById('refreshSubs');
  const selectAll = document.getElementById('selectAll');
  const markReadBtn = document.getElementById('markRead');
  const markUnreadBtn = document.getElementById('markUnread');
  const deleteSelectedBtn = document.getElementById('deleteSelected');
  const exportSubs = document.getElementById('exportSubs');
  const clearSubs = document.getElementById('clearSubs');
  const tabOffers = document.getElementById('tabOffers');
  const offersPane = document.getElementById('offersPane');
  const offersList = document.getElementById('offersList');
  const offersSearch = document.getElementById('offersSearch');
  const refreshOffers = document.getElementById('refreshOffers');
  const exportOffers = document.getElementById('exportOffers');
  const clearOffers = document.getElementById('clearOffers');

  function showDashboard(){
    if(adminLogin) adminLogin.style.display = 'none';
    if(adminDashboard) adminDashboard.style.display = 'block';
    loadSelectedPage();
    renderSubs();
    renderOffers();
  }

  // If a login form exists on this page (legacy), handle it. New flow uses login.html.
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const u = document.getElementById('loginUser').value.trim();
      const p = document.getElementById('loginPass').value;
      if(u === 'admin' && p === 'admin123'){
        localStorage.setItem('yim_admin', '1');
        showDashboard();
        const a = document.querySelector('a[href="admins.html"]'); if(a) a.style.display='';
      } else {
        alert('Invalid credentials for demo. Use admin / admin123');
      }
    });
  }

  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('yim_admin');
    if(adminDashboard) adminDashboard.style.display = 'none';
    if(adminLogin) adminLogin.style.display = 'block'; else location.replace('login.html');
    const a = document.querySelector('a[href="admins.html"]'); if(a) a.style.display='none';
  });

  // Tabs
  tabEdit.addEventListener('click', ()=>{ editPane.style.display='block'; subsPane.style.display='none'; offersPane && (offersPane.style.display='none'); });
  tabSubs.addEventListener('click', ()=>{ editPane.style.display='none'; subsPane.style.display='block'; offersPane && (offersPane.style.display='none'); renderSubs(); });
  tabOffers && tabOffers.addEventListener('click', ()=>{ editPane.style.display='none'; subsPane.style.display='none'; if(offersPane) offersPane.style.display='block'; renderOffers(); });

  // Load page content (try fetch, fallback to localStorage)
  async function loadSelectedPage(){
    const page = pageSelect.value;
    const localKey = 'page_saved:' + page;
    const saved = localStorage.getItem(localKey);
    try{
      const res = await fetch(page, {cache: 'no-store'});
      if(res.ok){
        const txt = await res.text();
        pageEditor.value = saved || txt;
        return;
      }
    }catch(err){/* ignore fetch error (file://) */}
    pageEditor.value = saved || ('Unable to load file. Paste content here or save changes to local storage.');
  }

  pageSelect.addEventListener('change', loadSelectedPage);

  saveLocal.addEventListener('click', ()=>{
    const page = pageSelect.value;
    const localKey = 'page_saved:' + page;
    localStorage.setItem(localKey, pageEditor.value);
    alert('Saved to localStorage for preview: ' + localKey);
  });

  previewBtn.addEventListener('click', ()=>{
    const w = window.open();
    const content = pageEditor.value;
    w.document.open();
    w.document.write(content);
    w.document.close();
  });

  downloadBtn.addEventListener('click', ()=>{
    const blob = new Blob([pageEditor.value], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = pageSelect.value;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  applyBtn.addEventListener('click', ()=>{
    const preview = window.open();
    preview.document.open();
    preview.document.write(pageEditor.value);
    preview.document.close();
  });

  // Submissions
  function getSubs(){
    try{ return JSON.parse(localStorage.getItem('yim_submissions')||'[]'); }catch(e){return []}
  }
  function saveSubs(arr){ localStorage.setItem('yim_submissions', JSON.stringify(arr)); }

  // Offers storage
  function getOffers(){ try{ return JSON.parse(localStorage.getItem('yim_offers')||'[]'); }catch(e){return []} }
  function saveOffers(arr){ localStorage.setItem('yim_offers', JSON.stringify(arr)); }

  function renderOffers(){
    if(!offersList) return;
    const q = (offersSearch && offersSearch.value || '').toLowerCase().trim();
    const offers = getOffers().slice().reverse();
    const filtered = offers.filter(o => {
      if(!q) return true;
      return (o.name||'').toLowerCase().includes(q) || (o.phone||'').toLowerCase().includes(q) || (o.method||'').toLowerCase().includes(q) || String(o.amount).includes(q);
    });
    if(!filtered.length){ offersList.innerHTML = '<div class="small muted">No offers found.</div>'; return; }
    offersList.innerHTML = '';
    filtered.forEach((o, idx) => {
      const realIndex = offers.length - 1 - idx;
      const item = document.createElement('div');
      item.className = 'offer-item';
      item.dataset.idx = realIndex;
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div style="flex:1">
            <strong>${escapeHtml(o.name||'—')}</strong> <span class="muted">(${escapeHtml(o.phone||'no-phone')})</span>
            <div class="small">Amount: ${escapeHtml(o.amount)} UGX — Method: ${escapeHtml(o.method)}</div>
            <div class="muted small">${new Date(o.ts).toLocaleString()}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn small" data-action="delete-offer">Delete</button>
          </div>
        </div>
      `;
      offersList.appendChild(item);
    });
  }

  function renderSubs(){
    const q = (subsSearch && subsSearch.value || '').toLowerCase().trim();
    const subs = getSubs().slice().reverse();
    const filtered = subs.filter(s => {
      if(!q) return true;
      return (s.name||'').toLowerCase().includes(q) || (s.email||'').toLowerCase().includes(q) || (s.message||'').toLowerCase().includes(q);
    });
    if(!filtered.length){ subsList.innerHTML = '<div class="small muted">No submissions found.</div>'; return; }
    subsList.innerHTML = '';
    filtered.forEach((s, idx) => {
      const realIndex = subs.length - 1 - idx; // index in original array
      const item = document.createElement('div');
      item.className = 'submission-item' + (s.read ? ' submission-read' : '');
      item.dataset.idx = realIndex;
      item.innerHTML = `
        <label style="display:inline-flex;align-items:center;gap:8px"><input class="sel" type="checkbox" data-idx="${realIndex}"></label>
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div style="flex:1">
            <strong>${escapeHtml(s.name||'—')}</strong> <span class="muted">(${escapeHtml(s.email||'no-email')})</span>
            <div class="small">${escapeHtml(s.message||'')}</div>
            <div class="muted small">${new Date(s.ts).toLocaleString()}</div>
          </div>
          <div class="submission-actions">
            <button class="btn small" data-action="reply" data-email="${encodeURIComponent(s.email||'')}">Reply</button>
            <button class="btn small" data-action="toggleRead">${s.read ? 'Mark Unread' : 'Mark Read'}</button>
            <button class="btn small" data-action="delete">Delete</button>
          </div>
        </div>
      `;
      subsList.appendChild(item);
    });
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Delegated actions
  subsList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const parent = btn.closest('.submission-item');
    if(!parent) return;
    const idx = Number(parent.dataset.idx);
    const subs = getSubs();
    if(action === 'reply'){
      const email = decodeURIComponent(btn.dataset.email || '');
      location.href = `mailto:${email}?subject=${encodeURIComponent('Reply from YIM')}`;
    } else if(action === 'toggleRead'){
      subs[idx].read = !subs[idx].read;
      saveSubs(subs);
      renderSubs();
    } else if(action === 'delete'){
      if(confirm('Delete this submission?')){
        subs.splice(idx,1);
        saveSubs(subs);
        renderSubs();
      }
    }
  });

  // Offers delegated actions
  offersList && offersList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const parent = btn.closest('.offer-item');
    if(!parent) return;
    const idx = Number(parent.dataset.idx);
    const offers = getOffers();
    if(action === 'delete-offer'){
      if(confirm('Delete this offer record?')){
        offers.splice(idx,1);
        saveOffers(offers);
        renderOffers();
      }
    }
  });

  // Bulk actions
  refreshSubs && refreshSubs.addEventListener('click', ()=> renderSubs());
  subsSearch && subsSearch.addEventListener('input', ()=> renderSubs());
  refreshOffers && refreshOffers.addEventListener('click', ()=> renderOffers());
  offersSearch && offersSearch.addEventListener('input', ()=> renderOffers());
  selectAll && selectAll.addEventListener('change', function(){
    const checked = this.checked;
    document.querySelectorAll('#subsList .sel').forEach(cb=> cb.checked = checked);
  });
  markReadBtn && markReadBtn.addEventListener('click', ()=> bulkSetRead(true));
  markUnreadBtn && markUnreadBtn.addEventListener('click', ()=> bulkSetRead(false));
  deleteSelectedBtn && deleteSelectedBtn.addEventListener('click', ()=> bulkDelete());

  function bulkSetRead(val){
    const subs = getSubs();
    const to = Array.from(document.querySelectorAll('#subsList .sel')).filter(cb=>cb.checked).map(cb=>Number(cb.dataset.idx));
    if(!to.length){ alert('No items selected'); return }
    to.forEach(i=> subs[i] && (subs[i].read = val));
    saveSubs(subs);
    renderSubs();
  }

  function bulkDelete(){
    const subs = getSubs();
    const to = Array.from(document.querySelectorAll('#subsList .sel')).filter(cb=>cb.checked).map(cb=>Number(cb.dataset.idx));
    if(!to.length){ alert('No items selected'); return }
    if(!confirm('Delete selected submissions?')) return;
    // remove by descending index
    to.sort((a,b)=>b-a).forEach(i=> subs.splice(i,1));
    saveSubs(subs);
    renderSubs();
  }

  exportSubs.addEventListener('click', ()=>{
    const subs = getSubs();
    if(!subs.length){ alert('No submissions'); return }
    const rows = [['name','email','message','timestamp']];
    subs.forEach(s=> rows.push([s.name,s.email,(s.message||'').replace(/\n/g,' '), new Date(s.ts).toISOString()]));
    const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'submissions.csv'; a.click(); URL.revokeObjectURL(a.href);
  });

  exportOffers && exportOffers.addEventListener('click', ()=>{
    const offers = getOffers();
    if(!offers.length){ alert('No offers'); return }
    const rows = [['name','phone','method','amount','timestamp']];
    offers.forEach(o=> rows.push([o.name,o.phone,o.method,o.amount, new Date(o.ts).toISOString()]));
    const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'offers.csv'; a.click(); URL.revokeObjectURL(a.href);
  });

  clearOffers && clearOffers.addEventListener('click', ()=>{
    if(confirm('Clear all stored offers?')){ localStorage.removeItem('yim_offers'); renderOffers(); }
  });

  clearSubs.addEventListener('click', ()=>{
    if(confirm('Clear all stored submissions?')){ localStorage.removeItem('yim_submissions'); renderSubs(); }
  });

  // Auto-login if set
  if(localStorage.getItem('yim_admin')) showDashboard();
});
