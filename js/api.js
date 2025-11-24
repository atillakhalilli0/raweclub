// js/api.js
const API_BASE = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("raweclub_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJsonResponse(res) {
  const text = await res.text();
  let data;
  try { 
    data = text ? JSON.parse(text) : {}; 
  } catch (err) { 
    data = { message: text }; 
  }
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ----------------------
// Auth API
// ----------------------
export const authApi = {
  signup: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },
  login: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },
  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
};

// ----------------------
// Design API
// ----------------------
export const designApi = {
  create: async (payload) => {
    const res = await fetch(`${API_BASE}/designs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },
  getMyDesigns: async () => {
    const res = await fetch(`${API_BASE}/designs/my`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
  getDesign: async (id) => {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
  // ----------------------
  // Admin API: Get all user designs
  // ----------------------
  getAll: async () => {
    const res = await fetch(`${API_BASE}/designs`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },
};
