import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupabaseJwtPayload } from './supabase-jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupabaseJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as SupabaseJwtPayload;
  },
);
