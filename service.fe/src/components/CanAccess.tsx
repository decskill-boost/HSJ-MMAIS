import type { ReactNode } from 'react';
import type { Permission } from '../types/permissions';
import { usePermission } from '../hooks/usePermission';

interface CanAccessProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ permission, children, fallback = null }: CanAccessProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
