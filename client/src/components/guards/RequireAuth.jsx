import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Mbron faqet që kërkojnë kyçje (p.sh. profili). Ruan destinacionin për rikthim.
export function RequireAuth({ children }) {
    const { ready, isAuthed } = useAuth();
    const location = useLocation();
    if (!ready) return null;
    if (!isAuthed) return <Navigate to="/hyrje" state={{ from: location.pathname }} replace />;
    return children;
}