import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-light)', background: 'var(--bg-dark)' }}>
        <p>Yönetici yetkileri doğrulanıyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/giris" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/yetkisiz" replace />;
  }

  return children;
}
