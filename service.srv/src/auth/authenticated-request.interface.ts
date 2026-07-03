import type { Request } from 'express';
import type { SupabaseJwtPayload } from './supabase-jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: SupabaseJwtPayload;
}
