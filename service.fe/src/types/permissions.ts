export enum UserRole {
  MEDICO = 'medico',
  PACIENTE = 'paciente',
  ACOMPANHANTE = 'acompanhante',
}

export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  EXPORT_DATA = 'export:data',
  PRESCRIBE_EXERCISES = 'prescribe:exercises',
  MANAGE_EXERCISES = 'manage:exercises',
  READ_ALL_PATIENTS = 'read:all_patients',
  READ_OWN_SESSIONS = 'read:own_sessions',
  WRITE_OWN_SESSIONS = 'write:own_sessions',
}

export interface UserProfile {
  idUser: string;
  nome: string;
  email: string;
  role: UserRole;
  xp: number;
  nivel: number;
  streakAtual: number;
  urlFotoPerfil: string | null;
  permissions: Permission[];
}
