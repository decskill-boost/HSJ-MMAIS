import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'O email não é válido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O nome tem de ter pelo menos 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Tipo de utilizador desconhecido.' })
  tipo_utilizador?: UserRole;
}
