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
import { createHash, randomBytes } from 'node:crypto';
import { EmailService } from '../email/email.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
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

    return this.createSession(updatedUser);
  }


  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        message:
          'Ако съществува профил с този имейл, ще получиш инструкции за възстановяване на паролата.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    // Обезсилваме предишните неизползвани токени.
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        rawToken,
      );
    } catch {
      // Не разкриваме дали имейлът принадлежи на регистриран профил.
    }

    return {
      message:
        'Ако съществува профил с този имейл, ще получиш инструкции за възстановяване на паролата.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const now = new Date();

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now
    ) {
      throw new BadRequestException(
        'Линкът за възстановяване е невалиден или е изтекъл.',
      );
    }

    const newPasswordHash = await hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      const claimedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimedToken.count !== 1) {
        throw new BadRequestException(
          'Линкът за възстановяване е невалиден или е изтекъл.',
        );
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    });

    return {
      message: 'Паролата е променена успешно. Можеш да влезеш в профила си.',
    };
  }

}
