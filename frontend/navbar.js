// navbar.js - Ultra-Premium DevDeploy Navigation Engine
document.addEventListener('DOMContentLoaded', () => {
    const navHTML = `
    <nav class="fixed top-0 left-0 w-full z-[1000] backdrop-blur-3xl border-b border-white/5 bg-black/40 px-10">
        <div class="max-w-[1600px] mx-auto py-6 flex items-center justify-between">
            <a href="/dashboard" class="flex items-center gap-4 text-3xl font-black text-white group">
                <div class="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:scale-110 transition duration-500">🚀</div>
                DevDeploy
            </a>
            
            <div class="hidden md:flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                <a href="/dashboard" class="nav-link hover:text-white transition-all">Command Deck</a>
                <a href="/upload" class="nav-link hover:text-white transition-all">Zip Pulse</a>
                <a href="/projects" class="nav-link hover:text-white transition-all">Pipelines</a>
                <a href="/github" class="nav-link hover:text-white transition-all">Node:GitHub</a>
                <a href="/aws" class="nav-link hover:text-white transition-all">Node:AWS</a>
            </div>

            <div class="flex items-center gap-8">
                <button onclick="logout()" class="px-6 py-2.5 rounded-xl border border-white/10 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">Abort</button>
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-black text-white border border-white/10 shadow-2xl relative">
                    ${(localStorage.getItem('username') || 'A')[0].toUpperCase()}
                    <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black/50"></div>
                </div>
            </div>
        </div>
    </nav>
    <style>
        .nav-link { position: relative; padding: 10px 0; }
        .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: white; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-link:hover::after { width: 100%; }
        [href="${window.location.pathname}"] { color: white !important; }
        [href="${window.location.pathname}"]::after { width: 100%; }
    </style>
    `;
    const navContainer = document.createElement('div');
    navContainer.innerHTML = navHTML;
    document.body.prepend(navContainer);
});

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}
