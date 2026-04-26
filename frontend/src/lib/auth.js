import { createContext, useContext, useState, useEffect, useCallback, createElement } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pp_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!user);

  // Sync with API on mount to ensure session still valid
  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data && data.email) {
          setUser(data);
          localStorage.setItem("pp_user", JSON.stringify(data));
        } else {
          // If 401, clear local storage
          localStorage.removeItem("pp_user");
          localStorage.removeItem("pp_token");
          setUser(null);
        }
      })
      .catch(() => {
        // If network error, still keep the local user for offline/stale feeling
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login({ email, password });
    if (result && result.email) {
      setUser(result);
      localStorage.setItem("pp_user", JSON.stringify(result));
      if (result.token) localStorage.setItem("pp_token", result.token);
      return result;
    }
    throw new Error(result?.message || "Invalid email or password");
  }, []);

  const signup = useCallback(async (data) => {
    const result = await api.register(data);
    if (result && result.email) {
      setUser(result);
      localStorage.setItem("pp_user", JSON.stringify(result));
      if (result.token) localStorage.setItem("pp_token", result.token);
      return result;
    }
    throw new Error(result?.message || "Registration failed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem("pp_user");
    localStorage.removeItem("pp_token");
    setUser(null);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, login, signup, logout } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
