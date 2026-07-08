import type { UserProfile as BaseUserProfile } from "./permissions";

export type UserProfile = BaseUserProfile;

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
