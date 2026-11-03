var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, } from '@nestjs/common';
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
            };
        });
        return [...vaccinationReminders, ...dewormingReminders]
            .sort((a, b) => new Date(a.dueAt).getTime() -
            new Date(b.dueAt).getTime());
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