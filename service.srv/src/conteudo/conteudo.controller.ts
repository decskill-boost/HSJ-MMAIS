import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConteudoService } from './conteudo.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('conteudo')
export class ConteudoController {
  constructor(private readonly conteudoService: ConteudoService) {}

  @Get('landing')
  getLandingContent() {
    return this.conteudoService.getLandingContent();
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  @Put('landing')
  updateLandingContent(@Body() data: Record<string, string>) {
    return this.conteudoService.updateLandingContent(data);
  }
}
