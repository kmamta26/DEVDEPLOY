const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { msg: `Invalid server response (${res.status})` };
  }
}

export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.msg || 'Login failed');
  return data;
}

export async function apiSignup(username, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Signup failed');
  return data;
}

export async function apiGetProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: getHeaders(),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  const data = await parseJsonResponse(res);
  return data;
}

export async function apiDeploy(formData) {
  const res = await fetch(`${API_BASE}/deploy`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.msg || 'Deployment failed');
  return data;
}

export async function apiDeleteProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.msg || 'Delete failed');
  return data;
}

export async function apiHealthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return parseJsonResponse(res);
}

export async function apiGetLogs(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/logs`, {
    headers: getHeaders(),
  });
  if (!res.ok) return [];
  return parseJsonResponse(res);
}
