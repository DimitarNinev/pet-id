import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';

type ReminderStatus = 'UPCOMING' | 'OVERDUE';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) { }

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

    const [vaccinations, dewormings, personalReminders] = await Promise.all([
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

      this.prisma.reminder.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          status: true,
          animal: {
            select: {
              id: true,
              name: true,
              petId: true,
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
        source: 'MEDICAL' as const,
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
        source: 'MEDICAL' as const,
      };
    });

    const personalReminderItems = personalReminders.map((item) => {
      const status =
        item.status === 'UPCOMING'
          ? this.getStatus(item.dueAt, today)
          : item.status;

      return {
        id: item.id,
        animalId: item.animal.id,
        animalName: item.animal.name,
        petId: item.animal.petId,
        source: 'PERSONAL' as const,
        type: 'PERSONAL' as const,
        title: item.title,
        description: item.description,
        dueAt: item.dueAt.toISOString(),
        status,
      };
    });

    return [...vaccinationReminders, ...dewormingReminders, ...personalReminderItems,]
      .sort(
        (a, b) =>
          new Date(a.dueAt).getTime() -
          new Date(b.dueAt).getTime(),
      );
  }

  async create(userId: string, dto: CreateReminderDto) {
    // Проверяваме дали потребителят е собственик.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Само собственици могат да създават лични напомняния.',
      );
    }

    // Проверяваме дали животното принадлежи на потребителя.
    const animal = await this.prisma.animal.findFirst({
      where: {
        id: dto.animalId,
        owners: {
          some: { userId },
        },
      },
      select: {
        id: true,
      },
    });

    if (!animal) {
      throw new NotFoundException(
        'Животното не е намерено или нямате достъп до него.',
      );
    }

    // Създаваме личното напомняне.
    return this.prisma.reminder.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueAt: new Date(dto.dueAt),
        userId,
        animalId: animal.id,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            petId: true,
          },
        },
      },
    });
  }

  async remove(userId: string, reminderId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Нямаш право да изтриваш лични напомняния.',
      );
    }

    const result = await this.prisma.reminder.deleteMany({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Личното напомняне не е намерено.');
    }

    return {
      message: 'Напомнянето беше изтрито успешно.',
    };
  }

  private getStatus(
    dueAt: Date,
    today: string,
  ): ReminderStatus {
    const dueDate = dueAt.toISOString().slice(0, 10);

    return dueDate < today ? 'OVERDUE' : 'UPCOMING';
  }
}