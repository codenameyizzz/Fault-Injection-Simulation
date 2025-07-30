// src/context/AuthContext.js
"use client";
import { createContext, useState, useEffect } from "react";
import api from "@/api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Cek token & fetch user detail
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api.get("/auth/me")
        .then(res => setUser(res.data))      // <-- res.data harus berisi { username, role, ... }
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 2) Login: simpan token, panggil /auth/me
  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const token = res.data.access_token;
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Ambil detail user lengkap
    const me = await api.get("/auth/me");
    setUser(me.data);   // me.data: { username, role, ... }
  };

  // 3) Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
