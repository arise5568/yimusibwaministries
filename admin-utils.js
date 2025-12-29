document.addEventListener('DOMContentLoaded', function(){
  try{
    // hide admins link for non-admins
    const adminAnchors = Array.from(document.querySelectorAll('a[href="admins.html"], a[href="./admins.html"], a[href="/admins.html"]'));
    const isAdmin = localStorage.getItem('yim_admin') === '1';
    adminAnchors.forEach(a => { a.style.display = isAdmin ? '' : 'none'; });

    // protect direct access to admins.html
    const url = location.href;
    if(url.includes('admins.html') || location.pathname.endsWith('/admins.html')){
      if(!isAdmin){
        // redirect to dedicated login page for admin access
        location.replace('login.html');
      }
    }
  }catch(e){ console.error('admin-utils error', e); }
});
