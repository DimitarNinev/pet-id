import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

type ReminderStatus = 'UPCOMING' | 'OVERDUE';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // Проверяваме актуалната роля на потребителя.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Напомнянията са достъпни само за собственици на животни.',
      );
    }

    const [vaccinations, dewormings] = await Promise.all([
      this.prisma.vaccination.findMany({
        where: {
          nextDueAt: { not: null },
          medicalRecord: {
            is: {
              animal: {
                is: {
                  owners: {
                    some: { userId },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          vaccineName: true,
          nextDueAt: true,
          medicalRecord: {
            select: {
              animal: {
                select: {
                  id: true,
                  name: true,
                  petId: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.deworming.findMany({
        where: {
          nextDueAt: { not: null },
          medicalRecord: {
            is: {
              animal: {
                is: {
                  owners: {
                    some: { userId },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          productName: true,
          dewormingType: true,
          nextDueAt: true,
          medicalRecord: {
            select: {
              animal: {
                select: {
                  id: true,
                  name: true,
                  petId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Сравняваме календарните дати в часовата зона на България.
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Sofia',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const vaccinationReminders = vaccinations.map((item) => {
      const dueAt = item.nextDueAt!;

      return {
        id: item.id,
        animalId: item.medicalRecord.animal.id,
        animalName: item.medicalRecord.animal.name,
        petId: item.medicalRecord.animal.petId,
        type: 'VACCINATION' as const,
        title: item.vaccineName,
        dueAt: dueAt.toISOString(),
        status: this.getStatus(dueAt, today),
      };
    });

    const dewormingReminders = dewormings.map((item) => {
      const dueAt = item.nextDueAt!;

      return {
        id: item.id,
        animalId: item.medicalRecord.animal.id,
        animalName: item.medicalRecord.animal.name,
        petId: item.medicalRecord.animal.petId,
        type: 'DEWORMING' as const,
        title: item.productName,
        dewormingType: item.dewormingType,
        dueAt: dueAt.toISOString(),
        status: this.getStatus(dueAt, today),
      };
    });

    return [...vaccinationReminders, ...dewormingReminders]
      .sort(
        (a, b) =>
          new Date(a.dueAt).getTime() -
          new Date(b.dueAt).getTime(),
      );
  }

  private getStatus(
    dueAt: Date,
    today: string,
  ): ReminderStatus {
    const dueDate = dueAt.toISOString().slice(0, 10);

    return dueDate < today ? 'OVERDUE' : 'UPCOMING';
  }
}