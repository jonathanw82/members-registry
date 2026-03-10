// src/api/client.js
// ─────────────────────────────────────────────────────────────────────────────
// Central API client. All requests go through here.
// Change API_BASE if your Django server runs on a different host/port.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Simple event bus — fires when a 401 is received so AuthContext can log out
export const authEvents = {
  listeners: [],
  emit() { this.listeners.forEach(fn => fn()); },
  on(fn)  { this.listeners.push(fn); },
};

const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem("access_token");

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Token expired — broadcast logout
    if (res.status === 401) {
      authEvents.emit();
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw err;
    }

    // 204 No Content
    if (res.status === 204) return null;

    return res.json();
  },

  get:    (path)        => api.request(path),
  post:   (path, body)  => api.request(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  (path, body)  => api.request(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)        => api.request(path, { method: "DELETE" }),
};

export default api;
