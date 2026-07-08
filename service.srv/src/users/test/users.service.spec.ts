import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Permission } from '../permission.enum';
import { Perfil } from '../perfil.entity';
import { Permissao } from '../permissao.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { UserRole } from '../user-role.enum';
import { UsersService } from '../users.service';

const mockPermissao = (nome: Permission): Permissao =>
  ({ id: `perm-${nome}`, nome }) as Permissao;

const mockPerfil = (role: UserRole, perms: Permission[]): Perfil =>
  ({
    id: `perfil-${role}`,
    nome: role,
    permissoes: perms.map(mockPermissao),
  }) as Perfil;

const mockUser = (overrides: Partial<Utilizador> = {}): Utilizador =>
  ({
    id_user: 'user-uuid',
    nome: 'Dr. Test',
    email: 'test@example.com',
    tipo_utilizador: UserRole.CORPO_CLINICO,
    xp: 0,
    nivel: 1,
    streak_atual: 0,
    streak_ultima_atividade: null,
    data_registo: new Date(),
    url_foto_perfil: null,
    permissoesDirectas: [],
    ...overrides,
  }) as Utilizador;

describe('UsersService', () => {
  let service: UsersService;
  let utilizadorRepo: jest.Mocked<Pick<Repository<Utilizador>, 'findOne'>>;
  let perfilRepo: jest.Mocked<Pick<Repository<Perfil>, 'findOne'>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Utilizador),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Perfil),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) =>
              key === 'SUPABASE_URL'
                ? 'http://localhost:54321'
                : 'service-role-key-de-teste',
            ),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    utilizadorRepo = module.get(getRepositoryToken(Utilizador));
    perfilRepo = module.get(getRepositoryToken(Perfil));
  });

  it('returns user with correct permissions for corpo_clinico', async () => {
    utilizadorRepo.findOne.mockResolvedValue(mockUser());
    perfilRepo.findOne.mockResolvedValue(
      mockPerfil(UserRole.CORPO_CLINICO, [
        Permission.VIEW_DASHBOARD,
        Permission.PRESCRIBE_EXERCISES,
        Permission.READ_ALL_PATIENTS,
      ]),
    );

    const result = await service.findById('user-uuid');

    expect(result.role).toBe(UserRole.CORPO_CLINICO);
    expect(result.permissions).toContain(Permission.READ_ALL_PATIENTS);
    expect(result.permissions).toContain(Permission.PRESCRIBE_EXERCISES);
    expect(result.permissions).not.toContain(Permission.WRITE_OWN_SESSIONS);
  });

  it('returns user with correct permissions for paciente', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipo_utilizador: UserRole.PACIENTE }),
    );
    perfilRepo.findOne.mockResolvedValue(
      mockPerfil(UserRole.PACIENTE, [
        Permission.READ_OWN_SESSIONS,
        Permission.WRITE_OWN_SESSIONS,
      ]),
    );

    const result = await service.findById('user-uuid');

    expect(result.permissions).toContain(Permission.WRITE_OWN_SESSIONS);
    expect(result.permissions).not.toContain(Permission.READ_ALL_PATIENTS);
  });

  it('returns user with correct permissions for acompanhante', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipo_utilizador: UserRole.ACOMPANHANTE }),
    );
    perfilRepo.findOne.mockResolvedValue(
      mockPerfil(UserRole.ACOMPANHANTE, [
        Permission.VIEW_DASHBOARD,
        Permission.READ_OWN_SESSIONS,
      ]),
    );

    const result = await service.findById('user-uuid');

    expect(result.permissions).toContain(Permission.READ_OWN_SESSIONS);
    expect(result.permissions).not.toContain(Permission.PRESCRIBE_EXERCISES);
  });

  it('throws NotFoundException when user does not exist', async () => {
    utilizadorRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('unknown-uuid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns empty permissions when perfil is not found', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipo_utilizador: 'invalid_role' }),
    );
    perfilRepo.findOne.mockResolvedValue(null);

    const result = await service.findById('user-uuid');

    expect(result.permissions).toEqual([]);
  });

  it('returns the stored streak when the last activity was today or yesterday', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ streak_atual: 5, streak_ultima_atividade: yesterday }),
    );
    perfilRepo.findOne.mockResolvedValue(null);

    const result = await service.findById('user-uuid');

    expect(result.streakAtual).toBe(5);
  });

  it('reflects a decayed streak (0) after a multi-day gap, without persisting anything', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ streak_atual: 7, streak_ultima_atividade: threeDaysAgo }),
    );
    perfilRepo.findOne.mockResolvedValue(null);

    const result = await service.findById('user-uuid');

    expect(result.streakAtual).toBe(0);
    expect(utilizadorRepo.findOne).toHaveBeenCalledTimes(1);
  });
});
