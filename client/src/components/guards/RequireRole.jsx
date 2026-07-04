import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Mbrojtja e faqeve sipas rolit (paneli administrativ, agjenti, ndërtuesi).
export function RequireRole({ roles, children }) {
  const { ready, role } = useAuth();
  if (!ready) return null;
  if (!roles.includes(role)) return <Navigate to="/hyrje" replace />;
  return children;
}
