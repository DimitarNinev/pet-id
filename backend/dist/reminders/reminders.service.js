var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let RemindersService = class RemindersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user || user.role !== 'OWNER') {
            throw new ForbiddenException('Напомнянията са достъпни само за собственици на животни.');
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
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Sofia',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date());
        const vaccinationReminders = vaccinations.map((item) => {
            const dueAt = item.nextDueAt;
            return {
                id: item.id,
                animalId: item.medicalRecord.animal.id,
                animalName: item.medicalRecord.animal.name,
                petId: item.medicalRecord.animal.petId,
                type: 'VACCINATION',
                title: item.vaccineName,
                dueAt: dueAt.toISOString(),
                status: this.getStatus(dueAt, today),
                source: 'MEDICAL',
            };
        });
        const dewormingReminders = dewormings.map((item) => {
            const dueAt = item.nextDueAt;
            return {
                id: item.id,
                animalId: item.medicalRecord.animal.id,
                animalName: item.medicalRecord.animal.name,
                petId: item.medicalRecord.animal.petId,
                type: 'DEWORMING',
                title: item.productName,
                dewormingType: item.dewormingType,
                dueAt: dueAt.toISOString(),
                status: this.getStatus(dueAt, today),
                source: 'MEDICAL',
            };
        });
        const personalReminderItems = personalReminders.map((item) => {
            const status = item.status === 'UPCOMING'
                ? this.getStatus(item.dueAt, today)
                : item.status;
            return {
                id: item.id,
                animalId: item.animal.id,
                animalName: item.animal.name,
                petId: item.animal.petId,
                source: 'PERSONAL',
                type: 'PERSONAL',
                title: item.title,
                description: item.description,
                dueAt: item.dueAt.toISOString(),
                status,
            };
        });
        return [...vaccinationReminders, ...dewormingReminders, ...personalReminderItems,]
            .sort((a, b) => new Date(a.dueAt).getTime() -
            new Date(b.dueAt).getTime());
    }
    async create(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user || user.role !== 'OWNER') {
            throw new ForbiddenException('Само собственици могат да създават лични напомняния.');
        }
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
            throw new NotFoundException('Животното не е намерено или нямате достъп до него.');
        }
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
    async remove(userId, reminderId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user || user.role !== 'OWNER') {
            throw new ForbiddenException('Нямаш право да изтриваш лични напомняния.');
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
    getStatus(dueAt, today) {
        const dueDate = dueAt.toISOString().slice(0, 10);
        return dueDate < today ? 'OVERDUE' : 'UPCOMING';
    }
};
RemindersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], RemindersService);
export { RemindersService };
//# sourceMappingURL=reminders.service.js.map