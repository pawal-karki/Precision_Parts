import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";

/**
 * ProtectedRoute — middleware component that:
 * 1. Shows loading spinner while checking auth
 * 2. Redirects to /login if not authenticated
 * 3. Redirects to correct dashboard if role doesn't match
 * 4. Renders children if authenticated with correct role
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Icon name="progress_activity" className="text-4xl text-secondary animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  const userRole = user.role?.toLowerCase();
  const requiredRole = role?.toLowerCase();

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to the user's own dashboard
    const dashboardMap = {
      admin: "/admin",
      staff: "/staff",
      customer: "/customer",
    };
    return <Navigate to={dashboardMap[userRole] || "/"} replace />;
  }

  return children;
}
