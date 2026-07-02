export const UserRole = {
  CORPO_CLINICO: "corpo_clinico",
  PACIENTE: "paciente",
  ACOMPANHANTE: "acompanhante",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Permission = {
  VIEW_DASHBOARD: "view:dashboard",
  EXPORT_DATA: "export:data",
  PRESCRIBE_EXERCISES: "prescribe:exercises",
  MANAGE_EXERCISES: "manage:exercises",
  READ_ALL_PATIENTS: "read:all_patients",
  READ_OWN_SESSIONS: "read:own_sessions",
  WRITE_OWN_SESSIONS: "write:own_sessions",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

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
  id_user?: string;
  tipo_utilizador?: UserRole;
  streak_atual?: number;
  data_registo?: string;
  url_foto_perfil?: string | null;
}
