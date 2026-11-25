import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async getStatistics() {
    const [
      totalUsers,
      totalOwners,
      totalVets,
      approvedVets,
      pendingVets,
      totalAdmins,
      totalAnimals,
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
      this.prisma.animal.count(),
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
      },
      animals: { total: totalAnimals },
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