// auth.js - Shared authentication check
(function() {
    const token = localStorage.getItem('token');
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    
    if (!token && !isLoginPage) {
        window.location.href = '/login';
    } else if (token && isLoginPage) {
        window.location.href = '/dashboard';
    }
})();

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
}
