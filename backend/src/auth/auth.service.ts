import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) { }

  private async createSession(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
    vetApproved: boolean;
  }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(
        'Вече има регистриран профил с този имейл.',
      );
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        passwordHash,
        phone: dto.phone?.trim() || null,
        clinicName: dto.role === 'VET'
          ? dto.clinicName?.trim() || null
          : null,
        clinicAddress: dto.role === 'VET'
          ? dto.clinicAddress?.trim() || null
          : null,
        city: dto.role === 'VET'
          ? dto.city?.trim() || null
          : null,
        role: dto.role,
        vetApproved: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        vetApproved: true,
      },
    });

    // Ветеринарите чакат потвърждение, преди да получат
    // достъп до функционалности, изискващи одобрен профил.
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Невалиден имейл или парола.');
    }

    return this.createSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      vetApproved: user.vetApproved,
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        vetApproved: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Потребителят не е намерен.');
    }

    return user;
  }
}
