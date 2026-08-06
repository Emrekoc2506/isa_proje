import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as authApi from "../services/authApi";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../utils/storage";

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
    const token = safeGetItem("accessToken");
    if (!token) {
      setUser(null);
      setRoles([]);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      const res = await authApi.me();
      if (res && safeGetItem("accessToken")) {
        setUser(res);
        setRoles(res.roles || []);
        return res;
      }
    } catch (err) {
      setUser(null);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    reloadUser();

    if (typeof window === "undefined") return;
    const handleSessionExpired = () => {
      safeRemoveItem("accessToken");
      safeRemoveItem("refreshToken");
      setUser(null);
      setRoles([]);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
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
    const refreshTokenVal = safeGetItem("refreshToken");
    try {
      if (refreshTokenVal) {
        await authApi.logout(refreshTokenVal);
      }
    } catch (err) {
      console.warn("Backend logout request error:", err);
    } finally {
      safeRemoveItem("accessToken");
      safeRemoveItem("refreshToken");
      setUser(null);
      setRoles([]);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.warn("Backend logoutAll request error:", err);
    } finally {
      safeRemoveItem("accessToken");
      safeRemoveItem("refreshToken");
      setUser(null);
      setRoles([]);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const rToken = safeGetItem("refreshToken");
    if (!rToken) {
      setUser(null);
      setRoles([]);
      return null;
    }
    try {
      const res = await authApi.refreshToken(rToken);
      if (res.accessToken) {
        safeSetItem("accessToken", res.accessToken);
        if (res.refreshToken) {
          safeSetItem("refreshToken", res.refreshToken);
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
  const isAdmin = roles.some(r => ['Admin', 'SuperAdmin', 'admin', 'superadmin'].includes(r)) || user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isSuperAdmin = roles.some(r => ['SuperAdmin', 'superadmin'].includes(r)) || user?.role === 'SuperAdmin' || user?.isSuperAdmin === true;

  const value = {
    user,
    roles,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
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
