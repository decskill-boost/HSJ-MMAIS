/** Papéis da plataforma — coluna `tipo_utilizador` da tabela `utilizadores`. */
export type TipoUtilizador = "paciente" | "corpo_clinico" | "admin";

export interface UserProfile {
  id_user: string;
  nome: string;
  email: string;
  tipo_utilizador: TipoUtilizador;
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
}
