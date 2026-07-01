import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard, JwtModule],
})
export class AuthModule {}
