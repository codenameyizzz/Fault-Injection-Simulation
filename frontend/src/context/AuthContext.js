// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

export const AuthContext = createContext(null);

async function fetchMe() {
  // Sesuaikan jika profil berada di endpoint lain
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch {
    try {
      const { data } = await api.get("/users/me");
      return data;
    } catch {
      return null;
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { username, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token + fetch profil (agar role terisi)
  useEffect(() => {
    (async () => {
      try {
        const t =
          typeof window !== "undefined" &&
          (localStorage.getItem("access_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("jwt"));
        if (t) {
          setToken(t);
          const me = await fetchMe();
          if (me) {
            const username = me.username || me.user || me.email || me.name;
            const role = me.role || me.roles?.[0] || me.type || me.account_type;
            const nextUser = { username, role };
            setUser(nextUser);
            if (typeof window !== "undefined") {
              localStorage.setItem("user", JSON.stringify(nextUser));
            }
          } else {
            const u = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            if (u) setUser(JSON.parse(u));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      const tk = data.access_token || data.token;
      setToken(tk);
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", tk);
        localStorage.setItem("token", tk);
      }

      let nextUser = data.user
        ? { username: data.user.username || username, role: data.user.role }
        : { username, role: undefined };

      try {
        const me = await fetchMe();
        if (me) {
          nextUser = {
            username: me.username || nextUser.username,
            role: me.role || nextUser.role,
          };
        }
      } catch {}

      setUser(nextUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(nextUser));
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    return api.post("/auth/register", { username, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
