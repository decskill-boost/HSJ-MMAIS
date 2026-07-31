import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import type { Permission, UserRole } from "../types/permissions";
import { useUser } from "../contexts/UserContext";

interface ProtectedRouteProps {
  permission?: Permission;
  /** Um único papel. Atalho para `roles={[role]}`. */
  role?: UserRole;
  /**
   * Vários papéis, quando o mesmo ecrã serve mais do que um perfil.
   *
   * Existe porque o `role` sozinho compara por igualdade exata: quando a gestão
   * de utilizadores passou para o grupo do corpo clínico, as contas de `admin`
   * deixaram de passar em TODAS as rotas desse grupo — que são as únicas que a
   * barra lateral lhes mostra. Um administrador ficava sem plataforma nenhuma.
   */
  roles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  permission,
  role,
  roles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, permissions, user, isLoading } = useUser();

  // Captura o contexto vindo do Layout (se existir)
  const parentContext = useOutletContext();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  const papeisAceites = roles ?? (role ? [role] : []);
  if (papeisAceites.length > 0 && !papeisAceites.includes(user?.role as UserRole)) {
    return <Navigate to="/sem-autorizacao" replace />;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/sem-autorizacao" replace />;
  }

  // Encaminha o contexto para os filhos (Dashboard, Exercicios, etc.)
  return <Outlet context={parentContext} />;
}
