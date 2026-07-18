import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-light)', background: 'var(--bg-dark)' }}>
        <p>Oturum doğrulanıyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/giris" state={{ from: location }} replace />;
  }

  return children;
}
