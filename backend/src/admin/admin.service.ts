import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  private getCurrentMonthRange() {
    const timeZone = 'Europe/Sofia';
    const now = new Date();

    const monthParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(now);

    const year = Number(monthParts.find(part => part.type === 'year')?.value);
    const month = Number(monthParts.find(part => part.type === 'month')?.value);

    const getUtcDateForLocalMidnight = (
      targetYear: number,
      targetMonth: number,
    ) => {
      const utcDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(utcDate);

      const values = Object.fromEntries(
        parts.map(part => [part.type, Number(part.value)]),
      );

      const localTimeAsUtc = Date.UTC(
        values['year'],
        values['month'] - 1,
        values['day'],
        values['hour'],
        values['minute'],
        values['second'],
      );

      const offset = localTimeAsUtc - utcDate.getTime();

      return new Date(utcDate.getTime() - offset);
    };

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;

    return {
      start: getUtcDateForLocalMidnight(year, month),
      end: getUtcDateForLocalMidnight(nextMonthYear, nextMonth),
    };
  }

  async getStatistics() {
    const { start, end } = this.getCurrentMonthRange();

    const createdThisMonth = {
      gte: start,
      lt: end,
    };

    const [
      totalUsers,
      totalOwners,
      totalVets,
      approvedVets,
      pendingVets,
      totalAdmins,
      newUsersThisMonth,
      newVetsThisMonth,
      totalAnimals,
      newAnimalsThisMonth,
      totalMedicalRecords,
      totalReminders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.user.count({ where: { role: 'VET' } }),
      this.prisma.user.count({
        where: { role: 'VET', vetApproved: true },
      }),
      this.prisma.user.count({
        where: { role: 'VET', vetApproved: false },
      }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),

      this.prisma.user.count({
        where: { createdAt: createdThisMonth },
      }),
      this.prisma.user.count({
        where: {
          role: 'VET',
          createdAt: createdThisMonth,
        },
      }),

      this.prisma.animal.count(),
      this.prisma.animal.count({
        where: { createdAt: createdThisMonth },
      }),

      this.prisma.medicalRecord.count(),
      this.prisma.reminder.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        owners: totalOwners,
        vets: totalVets,
        approvedVets,
        pendingVets,
        admins: totalAdmins,
        newThisMonth: newUsersThisMonth,
      },
      animals: {
        total: totalAnimals,
        newThisMonth: newAnimalsThisMonth,
      },
      vets: {
        newThisMonth: newVetsThisMonth,
      },
      medicalRecords: { total: totalMedicalRecords },
      reminders: { total: totalReminders },
    };
  }

  async getPendingVets() {
    return this.prisma.user.findMany({
      where: {
        role: 'VET',
        vetApproved: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        clinicName: true,
        clinicAddress: true,
        city: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        vetApproved: true,
        city: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveVet(id: string) {
    const vet = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        vetApproved: true,
      },
    });

    if (!vet) {
      throw new NotFoundException('Потребителят не е намерен.');
    }

    if (vet.role !== 'VET') {
      throw new BadRequestException(
        'Избраният потребител не е ветеринар.',
      );
    }

    if (vet.vetApproved) {
      throw new BadRequestException(
        'Този ветеринар вече е одобрен.',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { vetApproved: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        vetApproved: true,
      },
    });
  }

  async getAnimals() {
    return this.prisma.animal.findMany({
      select: {
        id: true,
        petId: true,
        name: true,
        species: true,
        breed: true,
        sex: true,
        dateOfBirth: true,
        microchipId: true,
        createdAt: true,
        owners: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}