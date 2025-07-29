"use client";
import { createContext, useState, useEffect } from "react";
import api from "@/api/api"; // sudah terhubung

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek token dari localStorage saat pertama kali load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // 🔹 Panggil endpoint /auth/me jika ada untuk verifikasi user
      api.get("/auth/me")
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", res.data.access_token);
    setUser({ username }); // atau dari response API
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}