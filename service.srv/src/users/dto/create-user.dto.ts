import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'O email não é válido.' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'A palavra-passe tem de ter pelo menos 8 caracteres.',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'O nome tem de ter pelo menos 2 caracteres.' })
  nome: string;

  @IsEnum(UserRole, { message: 'Tipo de utilizador desconhecido.' })
  tipo_utilizador: UserRole;
}
