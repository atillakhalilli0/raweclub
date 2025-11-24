// js/adminApi.js
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

/* ------------------------------------------
   Admin API
--------------------------------------------- */
export const adminApi = {
  // Fetch all user designs (admin only)
  getAllDesigns: async () => {
    const res = await fetch(`${API_BASE}/designs`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },

  // Fetch single design by ID (admin only)
  getDesign: async (id) => {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
      method: "GET",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },

  // Delete any design by ID (admin only)
  deleteDesign: async (id) => {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    return handleJsonResponse(res);
  },

  // Update any design (admin only)
  updateDesign: async (id, payload) => {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },
};
