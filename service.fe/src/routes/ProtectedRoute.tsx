import { Navigate, Outlet } from "react-router-dom";
import type { Permission } from "../types/permissions";
import { useUser } from "../contexts/UserContext";

interface ProtectedRouteProps {
  permission?: Permission;
  redirectTo?: string;
}

export function ProtectedRoute({
  permission,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, permissions, isLoading } = useUser();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
