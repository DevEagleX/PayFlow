import { createContext, useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("paytab_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const persistSession = (token, userSummary) => {
    localStorage.setItem("paytab_token", token);
    localStorage.setItem("paytab_user", JSON.stringify(userSummary));
    setUser(userSummary);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/login", { email, password });
      persistSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName, email, phoneNumber, password) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/register", {
        fullName,
        email,
        phoneNumber,
        password
      });
      persistSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("paytab_token");
    localStorage.removeItem("paytab_user");
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
