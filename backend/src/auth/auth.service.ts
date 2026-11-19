import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) { }

  private async createSession(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: 'OWNER' | 'VET' | 'ADMIN';
    vetApproved: boolean;
    clinicName: string | null;
    clinicAddress: string | null;
    city: string | null;
    tokenVersion: number;
  }) {
    const { tokenVersion, ...publicUser } = user;

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion,
    });

    return {
      accessToken,
      user: publicUser,
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
        clinicName: dto.role === 'VET' ? dto.clinicName?.trim() || null : null,
        clinicAddress:
          dto.role === 'VET' ? dto.clinicAddress?.trim() || null : null,
        city: dto.role === 'VET' ? dto.city?.trim() || null : null,
        role: dto.role,
        vetApproved: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        vetApproved: true,
        clinicName: true,
        clinicAddress: true,
        city: true,
        tokenVersion: true,
      },
    });

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
      phone: user.phone,
      role: user.role,
      vetApproved: user.vetApproved,
      clinicName: user.clinicName,
      clinicAddress: user.clinicAddress,
      city: user.city,
      tokenVersion: user.tokenVersion,
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
        clinicName: true,
        clinicAddress: true,
        city: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Потребителят не е намерен.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Този имейл вече е използван от друг профил.',
      );
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Потребителят не е намерен.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone?.trim() || null,
        clinicName:
          currentUser.role === 'VET' ? dto.clinicName?.trim() || null : null,
        clinicAddress:
          currentUser.role === 'VET'
            ? dto.clinicAddress?.trim() || null
            : null,
        city: currentUser.role === 'VET' ? dto.city?.trim() || null : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        vetApproved: true,
        clinicName: true,
        clinicAddress: true,
        city: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Потребителят не е намерен.');
    }

    const isCurrentPasswordValid = await compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Текущата парола е неправилна.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'Новата парола трябва да бъде различна от текущата.',
      );
    }

    const newPasswordHash = await hash(dto.newPassword, 12);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        vetApproved: true,
        clinicName: true,
        clinicAddress: true,
        city: true,
        tokenVersion: true,
      },
    });

    // Издаваме нов токен за текущото устройство.
    // Всички предишни токени вече са невалидни.
    return this.createSession(updatedUser);
  }
}
