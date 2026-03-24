/* =========================================================
   DevDeploy — Premium Frontend Logic
   ========================================================= */

const API_URL = '/api';

// ---- DOM References ----
const authSection      = document.getElementById('authSection');
const mainDashboard    = document.getElementById('mainDashboard');
const authError        = document.getElementById('authError');
const deployStatus     = document.getElementById('deployStatus');
const projectsGrid     = document.getElementById('projectsGrid');
const emptyState       = document.getElementById('emptyState');
const userBadge        = document.getElementById('userBadge');
const usernameDisplay  = document.getElementById('usernameDisplay');

let isLoginMode = true;

// =========================================================
//  INITIALIZATION
// =========================================================
function init() {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('username');
  
  if (token && user) {
    showDashboard(user);
    fetchProjects();
  } else {
    showAuth();
  }
  
  setupListeners();
}

function setupListeners() {
  // Login / Signup Toggle
  document.getElementById('toggleAuthMode').onclick = (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('authSubtitle').textContent = isLoginMode ? 'Sign in to manage your deployments' : 'Join the revolution today';
    document.getElementById('loginBtn').textContent = isLoginMode ? 'Sign In' : 'Sign Up';
    document.getElementById('authToggleText').textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
    document.getElementById('toggleAuthMode').textContent = isLoginMode ? 'Create one' : 'Sign in';
  };

  // Login Action (Linked to Form)
  document.getElementById('authForm').onsubmit = (e) => {
    e.preventDefault();
    handleAuth();
  };
  
  // Logout Action
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    location.reload();
  };

  // Deploy Action (Linked to Form)
  document.getElementById('deployForm').onsubmit = (e) => {
    e.preventDefault();
    handleDeploy();
  };

  // Refresh Action
  document.getElementById('refreshBtn').onclick = fetchProjects;

  // Drag & Drop
  const zone = document.getElementById('dropZone');
  const fileInput = document.getElementById('projectFile');
  
  zone.onclick = () => fileInput.click();
  
  fileInput.onchange = () => {
    if (fileInput.files[0]) {
      document.getElementById('fileName').innerHTML = `Selected: <span style="color:var(--accent)">${fileInput.files[0].name}</span>`;
    }
  };

  zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; };
  zone.ondragleave = () => { zone.style.borderColor = 'var(--border)'; };
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      document.getElementById('fileName').innerHTML = `Selected: <span style="color:var(--accent)">${e.dataTransfer.files[0].name}</span>`;
    }
  };
}

// =========================================================
//  AUTHENTICATION
// =========================================================
async function handleAuth() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  if (!username || !password) return showAlert('authError', 'Please fill in all fields', 'error');

  btn.disabled = true;
  btn.textContent = 'Processing...';
  
  try {
    const endpoint = isLoginMode ? '/auth/login' : '/auth/signup';
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      showDashboard(data.user.username);
      fetchProjects();
    } else {
      showAlert('authError', data.msg || 'Auth failed', 'error');
    }
  } catch (err) {
    showAlert('authError', 'Server unreachable. Is the backend running?', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = isLoginMode ? 'Sign In' : 'Sign Up';
  }
}

// =========================================================
//  DEPLOYMENT
// =========================================================
async function handleDeploy() {
  const name = document.getElementById('projectName').value.trim();
  const github = document.getElementById('githubUrl').value.trim();
  const file = document.getElementById('projectFile').files[0];
  const btn = document.getElementById('deployBtn');

  if (!name || !file) return showAlert('deployStatus', 'Name and ZIP are required', 'error');

  const formData = new FormData();
  formData.append('projectName', name);
  formData.append('githubUrl', github);
  formData.append('projectFile', file);

  btn.disabled = true;
  btn.textContent = '⌛ Deploying project...';
  
  try {
    const res = await fetch(`${API_URL}/deploy`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      const finalUrl = `http://${window.location.hostname}:5000/${name}/`;
      showAlert('deployStatus', `🎉 Deployment success! Redirecting to your live output... <a href="${finalUrl}" target="_blank" style="color:var(--accent); font-weight:700;">Open Now</a>`, 'success');
      
      // Auto-refresh & redirect for "Immediate" experience (Linked)
      document.getElementById('projectName').value = '';
      document.getElementById('projectFile').value = '';
      document.getElementById('fileName').textContent = 'Drop project ZIP here or browse';
      
      setTimeout(() => {
          fetchProjects();
          window.open(finalUrl, '_blank'); // Open the result immediately
      }, 1500);
    } else {
      showAlert('deployStatus', data.msg || 'Deployment failed', 'error');
    }
  } catch {
    showAlert('deployStatus', 'Server Error. Check your connection.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 Deploy Now';
  }
}

// =========================================================
//  UI HELPERS
// =========================================================
function showDashboard(username) {
  authSection.style.display = 'none';
  mainDashboard.style.display = 'block';
  userBadge.style.display = 'flex';
  usernameDisplay.textContent = username;
}

function showAuth() {
  authSection.style.display = 'block';
  mainDashboard.style.display = 'none';
  userBadge.style.display = 'none';
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  el.innerHTML = msg; // Support for links (Linked)
  el.style.display = 'block';
  el.className = `alert alert-${type}`;
  setTimeout(() => el.style.display = 'none', 12000);
}

// =========================================================
//  PROJECT RENDERING
// =========================================================
async function fetchProjects() {
  try {
    const res = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.status === 401) return logout();
    const projects = await res.json();
    renderProjects(projects);
  } catch (err) {
    console.warn('Projects fetch failed');
  }
}

function renderProjects(projects) {
  projectsGrid.innerHTML = '';
  if (!projects.length) return emptyState.style.display = 'block';
  emptyState.style.display = 'none';

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card glass';
    card.innerHTML = `
      <div class="project-header">
        <span class="project-name">📦 ${p.name}</span>
        <span class="status-badge status-${p.status}">${p.status}</span>
      </div>
      <div class="project-url">
        ${p.url}
        <button class="btn-copy" onclick="copyUrl('${p.url}', this)">📋</button>
      </div>
      <div class="project-actions">
        <a href="${p.url}" target="_blank" class="btn-outline" style="flex: 1; text-decoration:none; justify-content:center;">Visit Site</a>
        <button class="btn-outline" style="flex: 1; color: #ef4444;" onclick="deleteProject('${p._id || p.id}')">Delete</button>
      </div>
    `;
    projectsGrid.appendChild(card);
  });
}

function copyUrl(url, btn) {
  navigator.clipboard.writeText(url);
  const old = btn.textContent;
  btn.textContent = '✅';
  setTimeout(() => btn.textContent = old, 1500);
}

async function deleteProject(id) {
  if (!confirm('🛑 Are you sure you want to PERMANENTLY delete this project and its files?')) return;
  
  try {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    
    if (res.ok) {
      showAlert('deployStatus', '✨ ' + data.msg, 'success');
      fetchProjects();
    } else {
      showAlert('deployStatus', '❌ ' + (data.msg || 'Delete failed'), 'error');
    }
  } catch (err) {
    showAlert('deployStatus', '❗ Connection error during deletion.', 'error');
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

// Auto-refresh when deploying
setInterval(() => {
  if (mainDashboard.style.display === 'block') {
    if (document.querySelector('.status-deploying')) fetchProjects();
  }
}, 4000);

init();
