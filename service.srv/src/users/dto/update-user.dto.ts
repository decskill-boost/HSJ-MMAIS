import { UserRole } from '../user-role.enum';

export class UpdateUserDto {
  email?: string;
  nome?: string;
  tipo_utilizador?: UserRole;
}
