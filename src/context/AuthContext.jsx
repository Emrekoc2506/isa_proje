import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as authApi from "../services/authApi";

const AuthContext = createContext(null);

export function isJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    let token = localStorage.getItem("accessToken");
    const rToken = localStorage.getItem("refreshToken");

    if (!token) {
      if (rToken) {
        try {
          setIsLoading(true);
          const refreshed = await authApi.refreshToken(rToken);
          if (refreshed?.accessToken) {
            localStorage.setItem("accessToken", refreshed.accessToken);
            if (refreshed.refreshToken) {
              localStorage.setItem("refreshToken", refreshed.refreshToken);
            }
            token = refreshed.accessToken;
          } else {
            throw new Error("Refresh failed");
          }
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setRoles([]);
          setIsLoading(false);
          return null;
        }
      } else {
        setUser(null);
        setRoles([]);
        setIsLoading(false);
        return null;
      }
    }

    if (isJwtExpired(token)) {
      if (rToken) {
        try {
          setIsLoading(true);
          const refreshed = await authApi.refreshToken(rToken);
          if (refreshed?.accessToken) {
            localStorage.setItem("accessToken", refreshed.accessToken);
            if (refreshed.refreshToken) {
              localStorage.setItem("refreshToken", refreshed.refreshToken);
            }
            token = refreshed.accessToken;
          } else {
            throw new Error("Refresh failed");
          }
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setRoles([]);
          setIsLoading(false);
          return null;
        }
      } else {
        localStorage.removeItem("accessToken");
        setUser(null);
        setRoles([]);
        setIsLoading(false);
        return null;
      }
    }

    try {
      setIsLoading(true);
      const res = await authApi.me();
      if (res) {
        setUser(res);
        setRoles(res.roles || []);
        return res;
      }
    } catch (err) {
      console.error("Failed to fetch user context profile:", err);
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
    try {
      const res = await authApi.login(credentials);
      const userProfile = await reloadUser();
      if (userProfile) {
        return { ...res, user: userProfile };
      }
      throw new Error("Giriş bilgileri alınamadı.");
    } catch (err) {
      setUser(null);
      setRoles([]);
      throw err;
    }
  }, [reloadUser]);

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
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
