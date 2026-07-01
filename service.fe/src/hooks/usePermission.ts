import type { Permission } from '../types/permissions';
import { useUser } from '../contexts/UserContext';

export function usePermission(permission: Permission): boolean {
  const { permissions } = useUser();
  return permissions.includes(permission);
}
