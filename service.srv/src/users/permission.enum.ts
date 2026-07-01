import { UserRole } from './user-role.enum';

export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  EXPORT_DATA = 'export:data',
  PRESCRIBE_EXERCISES = 'prescribe:exercises',
  MANAGE_EXERCISES = 'manage:exercises',
  READ_ALL_PATIENTS = 'read:all_patients',
  READ_OWN_SESSIONS = 'read:own_sessions',
  WRITE_OWN_SESSIONS = 'write:own_sessions',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CORPO_CLINICO]: [
    Permission.VIEW_DASHBOARD,
    Permission.EXPORT_DATA,
    Permission.PRESCRIBE_EXERCISES,
    Permission.MANAGE_EXERCISES,
    Permission.READ_ALL_PATIENTS,
  ],
  [UserRole.PACIENTE]: [
    Permission.VIEW_DASHBOARD,
    Permission.READ_OWN_SESSIONS,
    Permission.WRITE_OWN_SESSIONS,
  ],
  [UserRole.ACOMPANHANTE]: [
    Permission.VIEW_DASHBOARD,
    Permission.READ_OWN_SESSIONS,
  ],
};
