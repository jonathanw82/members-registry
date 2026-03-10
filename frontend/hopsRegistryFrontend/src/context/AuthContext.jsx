// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Provides user state + login / logout / register to the entire app.
// Wrap your app in <AuthProvider> to use the useAuth() hook anywhere.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import api, { authEvents } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // When the API client fires a 401, log out automatically
  useEffect(() => {
    authEvents.on(() => {
      setUser(null);
      localStorage.clear();
    });
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.post("/auth/login/", { username, password });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const register = async (formData) => {
    const data = await api.post("/auth/register/", formData);
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    const userData = { username: formData.username, email: formData.email, is_staff: false };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
