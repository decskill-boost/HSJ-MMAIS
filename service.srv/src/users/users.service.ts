import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Perfil } from '../entities/perfil.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { getEffectiveStreak } from '../sessoes/streak.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
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
      // Log detalhado para debugging: mostra tanto o erro quanto o objeto retornado
      // assim conseguimos ver a resposta do Supabase no servidor (stack trace no terminal).
      // Não alterar lógica de rethrow — mantemos 500 para o cliente.
      // eslint-disable-next-line no-console
      console.error('Supabase admin.createUser falhou', {
        error,
        data,
        createUserDto,
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
    return this.mapUtilizadorToProfile(savedUser as Utilizador);
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

  async disableUser(id_user: string) {
    const user = await this.utilizadorRepo.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    // Tentar remover o utilizador também do Supabase Auth (credenciais)
    try {
      // Supabase admin API: tenta apagar o utilizador por ID
      const { error: deleteError } =
        await this.supabaseAdmin.auth.admin.deleteUser(id_user);

      if (deleteError) {
        // Regista e falha para permitir diagnóstico — veremos se devemos fallback
        // eslint-disable-next-line no-console
        console.error('Supabase admin.deleteUser falhou', {
          deleteError,
          id_user,
        });
        throw new Error(
          deleteError.message ?? 'Falha ao remover utilizador do Supabase',
        );
      }
    } catch (supabaseErr) {
      // Se a remoção direta falhar, tentamos aplicar um ban como fallback
      // para garantir que o utilizador não consegue autenticar.
      // eslint-disable-next-line no-console
      console.warn(
        'Remoção no Supabase falhou — a tentar ban temporário como fallback',
        {
          err: supabaseErr,
          id_user,
        },
      );

      const { error: banError } =
        await this.supabaseAdmin.auth.admin.updateUserById(id_user, {
          ban_duration: '1000000h',
        });

      if (banError) {
        // eslint-disable-next-line no-console
        console.error('Supabase admin.updateUserById (ban) também falhou', {
          banError,
          id_user,
        });
        throw new Error(
          banError.message ?? 'Falha ao desativar utilizador no Supabase',
        );
      }
    }

    await this.utilizadorRepo.delete({ id_user });
    return { success: true };
  }
}
