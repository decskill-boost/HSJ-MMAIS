import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => UsersModule)],
  providers: [SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
