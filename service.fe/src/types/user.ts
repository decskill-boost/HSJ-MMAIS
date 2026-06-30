export interface UserProfile {
  id_user: string;
  nome: string;
  email: string;
  tipo_utilizador: string;
  xp: number;
  nivel: number;
  streak_atual: number;
  data_registo: string;
  url_foto_perfil?: string;
}

export interface PatientStatsProps {
  nivel: number;
  xp: number;
  streak: number;
  themeColor: string;
}

export interface PersonalInfoProps {
  user: UserProfile;
  onLogout?: () => void;
  onBack?: () => void;
}
