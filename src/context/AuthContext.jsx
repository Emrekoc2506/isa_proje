import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as authApi from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setRoles([]);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      const res = await authApi.me();
      if (res && res.user) {
        setUser(res.user);
        setRoles(res.user.roles || []);
        return res.user;
      }
    } catch (err) {
      console.error("Failed to fetch user context profile:", err);
      // Let the apiClient's 401 handling or retry logic deal with token expirations
      // If it throws and fails completely, clear user state
      setUser(null);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res && res.user) {
        setUser(res.user);
        setRoles(res.user.roles || []);
        return res;
      }
      throw new Error("Giriş bilgileri alınamadı.");
    } catch (err) {
      setUser(null);
      setRoles([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(payload);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Run backend logout in the background so it doesn't block the UI
    authApi.logout().catch(() => null);
    setUser(null);
    setRoles([]);
  }, []);

  const logoutAll = useCallback(async () => {
    // Run backend logoutAll in the background so it doesn't block the UI
    authApi.logoutAll().catch(() => null);
    setUser(null);
    setRoles([]);
  }, []);

  const refreshSession = useCallback(async () => {
    const rToken = localStorage.getItem("refreshToken");
    if (!rToken) {
      setUser(null);
      setRoles([]);
      return null;
    }
    try {
      const res = await authApi.refreshToken(rToken);
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        if (res.refreshToken) {
          localStorage.setItem("refreshToken", res.refreshToken);
        }
        return await reloadUser();
      }
    } catch (err) {
      console.error("Failed to refresh session:", err);
      await logout();
    }
    return null;
  }, [reloadUser, logout]);

  const isAuthenticated = !!user;
  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");

  const value = {
    user,
    roles,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshSession,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
