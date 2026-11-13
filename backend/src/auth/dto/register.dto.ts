
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clinicName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clinicAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsIn(['OWNER', 'VET'])
  role!: 'OWNER' | 'VET';
}
