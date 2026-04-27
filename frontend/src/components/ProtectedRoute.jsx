import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Show spinner while auth loads ─────────────────────
const AuthSpinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading InterviewIQ...</p>
    </div>
  </div>
);

// ── Protect route: must be logged in ──────────────────
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ── Public route: redirect if already logged in ───────
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <AuthSpinner />;

  if (isAuthenticated) {
    const dest = user?.role === 'recruiter' ? '/recruiter' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
};

// ── Role-based protection ─────────────────────────────
export const RoleRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <AuthSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
