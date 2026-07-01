import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Permission } from './permission.enum';
import { Perfil } from './perfil.entity';
import { Permissao } from './permissao.entity';
import { Utilizador } from './utilizador.entity';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

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
    idUser: 'user-uuid',
    nome: 'Dr. Test',
    email: 'test@example.com',
    tipoUtilizador: UserRole.CORPO_CLINICO,
    xp: 0,
    nivel: 1,
    streakAtual: 0,
    dataRegisto: new Date(),
    urlFotoPerfil: null,
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

    const result = await service.findByEmail('test@example.com');

    expect(result.role).toBe(UserRole.CORPO_CLINICO);
    expect(result.permissions).toContain(Permission.READ_ALL_PATIENTS);
    expect(result.permissions).toContain(Permission.PRESCRIBE_EXERCISES);
    expect(result.permissions).not.toContain(Permission.WRITE_OWN_SESSIONS);
  });

  it('returns user with correct permissions for paciente', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipoUtilizador: UserRole.PACIENTE }),
    );
    perfilRepo.findOne.mockResolvedValue(
      mockPerfil(UserRole.PACIENTE, [
        Permission.READ_OWN_SESSIONS,
        Permission.WRITE_OWN_SESSIONS,
      ]),
    );

    const result = await service.findByEmail('test@example.com');

    expect(result.permissions).toContain(Permission.WRITE_OWN_SESSIONS);
    expect(result.permissions).not.toContain(Permission.READ_ALL_PATIENTS);
  });

  it('returns user with correct permissions for acompanhante', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipoUtilizador: UserRole.ACOMPANHANTE }),
    );
    perfilRepo.findOne.mockResolvedValue(
      mockPerfil(UserRole.ACOMPANHANTE, [
        Permission.VIEW_DASHBOARD,
        Permission.READ_OWN_SESSIONS,
      ]),
    );

    const result = await service.findByEmail('test@example.com');

    expect(result.permissions).toContain(Permission.READ_OWN_SESSIONS);
    expect(result.permissions).not.toContain(Permission.PRESCRIBE_EXERCISES);
  });

  it('throws NotFoundException when user does not exist', async () => {
    utilizadorRepo.findOne.mockResolvedValue(null);

    await expect(service.findByEmail('unknown@example.com')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns empty permissions when perfil is not found', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ tipoUtilizador: 'invalid_role' }),
    );
    perfilRepo.findOne.mockResolvedValue(null);

    const result = await service.findByEmail('test@example.com');

    expect(result.permissions).toEqual([]);
  });
});
