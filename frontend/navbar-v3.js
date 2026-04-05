(function() {
    const pages = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Upload',    url: '/upload' },
        { name: 'Projects',   url: '/projects' },
        { name: 'GitHub',    url: '/github' },
        { name: 'AWS',       url: '/aws' }
    ];

    const currentPath = window.location.pathname;

    // Protection logic — Redirecting to Mission Control (Login) if unauthorized
    const token = localStorage.getItem('token');
    const isPublic = ['/login', '/', '/register', '/index.html'].includes(currentPath);
    if (!token && !isPublic) {
        window.location.href = '/login';
        return;
    }

    const renderNavbar = () => {
        const nav = document.createElement('nav');
        nav.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: rgba(3, 0, 20, 0.7); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px 60px; display: flex; items-center: center; justify-content: space-between;
        `;
        
        nav.innerHTML = `
            <div style="font-weight:900; font-size:1.5rem; tracking:-0.05em; color:white">Dev<span style="color:#A855F7">Deploy</span></div>
            <div style="display:flex; gap:40px; align-items:center">
                ${pages.map(p => {
                    const active = (currentPath === p.url) ? 'color:white' : 'color:rgba(255,255,255,0.4)';
                    return `<a href="${p.url}" style="text-decoration:none; font-size:12px; font-weight:800; text-transform:uppercase; tracking:0.2em; ${active}">${p.name}</a>`;
                }).join('')}
            </div>
            <button id="logoutBtn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px 25px; border-radius:1rem; font-size:10px; font-weight:900; tracking:0.1em; cursor:pointer">LOGOUT</button>
        `;
        document.body.prepend(nav);

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/login';
        });

        // Add Spacer
        const spacer = document.createElement('div');
        spacer.style.height = '120px';
        nav.parentNode.insertBefore(spacer, nav.nextSibling);
    };

    // Global Success/Error Notification System
    window.showToast = (msg, isError = false) => {
        const t = document.createElement('div');
        t.innerText = msg;
        t.style.cssText = `
            position: fixed; bottom: 40px; right: 40px; z-index: 2000;
            padding: 1rem 2rem; border-radius: 1rem; color: white;
            font-weight: 800; font-size: 0.8rem; text-transform: uppercase;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            background: ${isError ? '#ff4b4b' : 'linear-gradient(135deg, #a855f7, #ec4899)'};
            transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
            transform: translateY(100px); opacity: 0;
        `;
        document.body.appendChild(t);
        setTimeout(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; }, 10);
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(40px)'; setTimeout(() => t.remove(), 400); }, 3000);
    };

    if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register') {
        renderNavbar();
    }
})();
