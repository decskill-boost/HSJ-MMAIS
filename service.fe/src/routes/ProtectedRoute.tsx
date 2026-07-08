import { Navigate, Outlet, useOutletContext } from "react-router-dom"; // <-- Adiciona useOutletContext aqui
import type { Permission, UserRole } from "../types/permissions";
import { useUser } from "../contexts/UserContext";

interface ProtectedRouteProps {
  permission?: Permission;
  role?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  permission,
  role,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, permissions, user, isLoading } = useUser();

  // Captura o contexto vindo do Layout (se existir)
  const parentContext = useOutletContext();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  if (role && user?.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 🟢 CORREÇÃO: Encaminha o contexto para os filhos (Dashboard, Exercicios, etc.)
  return <Outlet context={parentContext} />;
}
