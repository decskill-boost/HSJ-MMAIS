import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  email: string;
  password: string;
  nome: string;
  tipo_utilizador: UserRole;
}
