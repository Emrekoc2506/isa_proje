import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-light)', background: 'var(--bg-dark)' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/panel"} replace />;
  }

  return children;
}
