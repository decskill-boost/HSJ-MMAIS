import type { Request } from 'express';
import type { UserRole } from '../users/user-role.enum';
import type { SupabaseJwtPayload } from './supabase-jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: SupabaseJwtPayload;
  /**
   * Papel de negócio confirmado na base de dados pelo `RolesGuard`.
   *
   * NÃO vem do token: o JWT do Supabase só traz `role: "authenticated"`. Fica
   * aqui para quem já passou pela guarda não ter de repetir a consulta —
   * ver `@CurrentRole()`.
   */
  roleUtilizador?: UserRole;
}
