import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { Perfil } from '../entities/perfil.entity';
import { Recompensa } from '../entities/recompensa.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { getEffectiveStreak } from '../sessoes/streak.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  // O tipo vem do próprio `createClient` para não haver divergência nos
  // parâmetros genéricos do SupabaseClient.
  private readonly supabaseAdmin: ReturnType<typeof createClient>;

  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Recompensa)
    private readonly recompensaRepo: Repository<Recompensa>,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  }

  private async mapUtilizadorToProfile(user: Utilizador) {
    const perfil = await this.perfilRepo.findOne({
      where: { nome: user.tipo_utilizador },
    });

    const rolePermissions = perfil?.permissoes?.map((p) => p.nome) ?? [];
    const directPermissions = user.permissoesDirectas?.map((p) => p.nome) ?? [];

    const permissions = [
      ...new Set([...rolePermissions, ...directPermissions]),
    ];

    return {
      idUser: user.id_user,
      nome: user.nome,
      email: user.email,
      role: user.tipo_utilizador,
      xp: user.xp,
      nivel: user.nivel,
      streakAtual: getEffectiveStreak(
        user.streak_atual,
        user.streak_ultima_atividade,
        new Date(),
      ),
      urlFotoPerfil: user.url_foto_perfil,
      permissions,
      data_registo: user.data_registo,
    };
  }

  /**
   * Progresso do próprio: o XP atual e o catálogo de conquistas.
   *
   * Substitui duas leituras que o browser fazia direto ao Supabase — o
   * catálogo de `recompensas` e o `xp` da linha do utilizador. O id vem do
   * token, nunca do cliente: ninguém pode pedir o progresso de outra criança.
   */
  async getProgresso(id_user: string) {
    const utilizador = await this.utilizadorRepo.findOne({
      where: { id_user },
      select: { xp: true },
    });

    if (!utilizador) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const recompensas = await this.recompensaRepo.find({
      order: { xp_necessario: 'ASC' },
    });

    return { xp: utilizador.xp, recompensas };
  }

  async findById(id_user: string) {
    const user = await this.utilizadorRepo.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    return this.mapUtilizadorToProfile(user);
  }

  async findAll() {
    const users = await this.utilizadorRepo.find({ order: { nome: 'ASC' } });
    return Promise.all(users.map((user) => this.mapUtilizadorToProfile(user)));
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.utilizadorRepo.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      email_confirm: true,
      user_metadata: {
        nome: createUserDto.nome,
        tipo_utilizador: createUserDto.tipo_utilizador,
      },
    });

    if (error || !data.user?.id) {
      // Só o erro do Supabase: o `createUserDto` traz a palavra-passe em claro
      // e o `data` traz o utilizador todo. Nada disso entra nos registos.
      console.error('Supabase admin.createUser falhou', {
        mensagem: error?.message,
        estado: error?.status,
      });
      throw new Error(
        error?.message ?? 'Não foi possível criar o utilizador no Supabase',
      );
    }

    const novoUtilizador = {
      id_user: data.user.id,
      nome: createUserDto.nome,
      email: createUserDto.email,
      tipo_utilizador: createUserDto.tipo_utilizador,
      xp: 0,
      nivel: 1,
      url_foto_perfil: null,
    } as DeepPartial<Utilizador>;

    const savedUser = await this.utilizadorRepo.save(novoUtilizador);
    return this.mapUtilizadorToProfile(savedUser);
  }

  async updateUser(id_user: string, updateUserDto: UpdateUserDto) {
    const user = await this.utilizadorRepo.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const { error } = await this.supabaseAdmin.auth.admin.updateUserById(
        id_user,
        {
          email: updateUserDto.email,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      user.email = updateUserDto.email;
    }

    if (updateUserDto.nome) {
      user.nome = updateUserDto.nome;
    }

    if (updateUserDto.tipo_utilizador) {
      user.tipo_utilizador = updateUserDto.tipo_utilizador;
    }

    return this.mapUtilizadorToProfile(await this.utilizadorRepo.save(user));
  }

  /**
   * Remove as credenciais no Supabase Auth. Trata o «utilizador não existe»
   * como sucesso, para que uma segunda tentativa não fique bloqueada.
   */
  private async removerCredenciaisSupabase(id_user: string) {
    const { error: deleteError } =
      await this.supabaseAdmin.auth.admin.deleteUser(id_user);

    if (!deleteError || deleteError.status === 404) {
      return;
    }

    // Só a mensagem e o estado: a resposta do Supabase traz dados do
    // utilizador que não devem entrar nos registos.
    console.error('Supabase admin.deleteUser falhou', {
      mensagem: deleteError.message,
      estado: deleteError.status,
    });

    // Se não conseguimos apagar, pelo menos banimos a conta para garantir
    // que já não é possível autenticar.
    const { error: banError } =
      await this.supabaseAdmin.auth.admin.updateUserById(id_user, {
        ban_duration: '1000000h',
      });

    if (banError) {
      console.error('Supabase admin.updateUserById (ban) também falhou', {
        mensagem: banError.message,
        estado: banError.status,
      });
      throw new InternalServerErrorException(
        'Não foi possível desativar as credenciais do utilizador',
      );
    }
  }

  async disableUser(id_user: string) {
    const user = await this.utilizadorRepo.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    // A base de dados primeiro, dentro da transacção, e o Supabase Auth como
    // último passo antes do commit: se a remoção do registo for recusada
    // (chaves estrangeiras de sessões, prescrições ou permissões), a
    // transacção é revertida e as credenciais ficam intactas.
    //
    // Fica uma janela por fechar: se o commit falhar depois de as credenciais
    // já terem sido apagadas, o registo sobrevive sem forma de autenticar.
    // É o lado seguro a falhar — ninguém ganha acesso a mais nada — mas obriga
    // a limpar o registo à mão. Fechá-la exigiria outbox ou commit em 2 fases.
    await this.utilizadorRepo.manager.transaction(async (manager) => {
      await manager.delete(Utilizador, { id_user });
      await this.removerCredenciaisSupabase(id_user);
    });

    return { success: true };
  }
}
