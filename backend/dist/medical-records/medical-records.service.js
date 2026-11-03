var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { MedicalRecordType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
let MedicalRecordsService = class MedicalRecordsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                vetApproved: true,
            },
        });
        if (!user) {
            throw new ForbiddenException('Потребителят не е намерен.');
        }
        return user;
    }
    async getAnimal(animalId) {
        const animal = await this.prisma.animal.findUnique({
            where: { id: animalId },
            select: { id: true },
        });
        if (!animal) {
            throw new NotFoundException('Животното не е намерено.');
        }
        return animal;
    }
    async findAll(userId, animalId) {
        const user = await this.getUser(userId);
        await this.getAnimal(animalId);
        if (user.role === UserRole.OWNER) {
            const ownership = await this.prisma.animalOwner.findFirst({
                where: { animalId, userId },
                select: { id: true },
            });
            if (!ownership) {
                throw new NotFoundException('Животното не е намерено.');
            }
            return this.prisma.medicalRecord.findMany({
                where: { animalId },
                include: {
                    examination: true,
                    vaccination: true,
                    deworming: true,
                    labResult: true,
                    organization: {
                        select: { id: true, name: true },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
                orderBy: { occurredAt: 'desc' },
            });
        }
        if (user.role === UserRole.VET && user.vetApproved) {
            return this.prisma.medicalRecord.findMany({
                where: {
                    animalId,
                    type: { not: MedicalRecordType.OWNER_NOTE },
                    createdBy: { role: UserRole.VET },
                },
                include: {
                    examination: true,
                    vaccination: true,
                    deworming: true,
                    labResult: true,
                    organization: {
                        select: { id: true, name: true },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
                orderBy: { occurredAt: 'desc' },
            });
        }
        throw new ForbiddenException('Нямаш право да преглеждаш медицинските записи.');
    }
    async create(userId, animalId, dto) {
        const user = await this.getUser(userId);
        await this.getAnimal(animalId);
        if (dto.type === MedicalRecordType.OWNER_NOTE) {
            if (user.role !== UserRole.OWNER) {
                throw new ForbiddenException('Само собственикът може да създава лични бележки.');
            }
            const ownership = await this.prisma.animalOwner.findFirst({
                where: { animalId, userId },
                select: { id: true },
            });
            if (!ownership) {
                throw new NotFoundException('Животното не е намерено.');
            }
            if (dto.examination ||
                dto.vaccination ||
                dto.labResult ||
                dto.deworming) {
                throw new BadRequestException('Личната бележка не трябва да съдържа специализирани медицински данни.');
            }
            return this.prisma.medicalRecord.create({
                data: {
                    animalId,
                    createdById: userId,
                    type: MedicalRecordType.OWNER_NOTE,
                    title: dto.title,
                    notes: dto.notes,
                    occurredAt: new Date(dto.occurredAt),
                },
                include: {
                    examination: true,
                    vaccination: true,
                    deworming: true,
                    labResult: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            });
        }
        if (user.role !== UserRole.VET || !user.vetApproved) {
            throw new ForbiddenException('Само одобрен ветеринар може да създава професионални медицински записи.');
        }
        if (dto.type !== MedicalRecordType.EXAMINATION &&
            dto.type !== MedicalRecordType.VACCINATION &&
            dto.type !== MedicalRecordType.DEWORMING) {
            throw new BadRequestException('Разрешено е създаването на преглед, ваксинация или обезпаразитяване.');
        }
        if (dto.type === MedicalRecordType.EXAMINATION) {
            if (!dto.examination) {
                throw new BadRequestException('Данните за прегледа са задължителни.');
            }
            if (dto.vaccination || dto.labResult || dto.deworming) {
                throw new BadRequestException('Записът от преглед не трябва да съдържа данни за други медицински процедури.');
            }
            return this.prisma.medicalRecord.create({
                data: {
                    animalId,
                    createdById: userId,
                    type: MedicalRecordType.EXAMINATION,
                    title: dto.title,
                    notes: dto.notes,
                    occurredAt: new Date(dto.occurredAt),
                    examination: {
                        create: {
                            reason: dto.examination.reason,
                            symptoms: dto.examination.symptoms,
                            clinicalFindings: dto.examination.clinicalFindings,
                            diagnosis: dto.examination.diagnosis,
                            recommendations: dto.examination.recommendations,
                            weightKg: dto.examination.weightKg,
                            temperatureC: dto.examination.temperatureC,
                        },
                    },
                },
                include: {
                    examination: true,
                    vaccination: true,
                    deworming: true,
                    labResult: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            });
        }
        if (dto.type === MedicalRecordType.VACCINATION) {
            if (!dto.vaccination) {
                throw new BadRequestException('Данните за ваксинацията са задължителни.');
            }
            if (dto.examination || dto.labResult || dto.deworming) {
                throw new BadRequestException('Записът за ваксинация не трябва да съдържа данни за други медицински процедури.');
            }
            return this.prisma.medicalRecord.create({
                data: {
                    animalId,
                    createdById: userId,
                    type: MedicalRecordType.VACCINATION,
                    title: dto.title,
                    notes: dto.notes,
                    occurredAt: new Date(dto.occurredAt),
                    vaccination: {
                        create: {
                            vaccineName: dto.vaccination.vaccineName,
                            manufacturer: dto.vaccination.manufacturer,
                            batchNumber: dto.vaccination.batchNumber,
                            administeredAt: new Date(dto.vaccination.administeredAt),
                            nextDueAt: dto.vaccination.nextDueAt
                                ? new Date(dto.vaccination.nextDueAt)
                                : undefined,
                            validUntil: dto.vaccination.validUntil
                                ? new Date(dto.vaccination.validUntil)
                                : undefined,
                            notes: dto.vaccination.notes,
                        },
                    },
                },
                include: {
                    examination: true,
                    vaccination: true,
                    deworming: true,
                    labResult: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            });
        }
        if (!dto.deworming) {
            throw new BadRequestException('Данните за обезпаразитяването са задължителни.');
        }
        if (dto.examination || dto.vaccination || dto.labResult) {
            throw new BadRequestException('Записът за обезпаразитяване не трябва да съдържа данни за други медицински процедури.');
        }
        return this.prisma.medicalRecord.create({
            data: {
                animalId,
                createdById: userId,
                type: MedicalRecordType.DEWORMING,
                title: dto.title,
                notes: dto.notes,
                occurredAt: new Date(dto.occurredAt),
                deworming: {
                    create: {
                        productName: dto.deworming.productName,
                        manufacturer: dto.deworming.manufacturer,
                        batchNumber: dto.deworming.batchNumber,
                        dewormingType: dto.deworming.dewormingType,
                        administeredAt: new Date(dto.deworming.administeredAt),
                        dose: dto.deworming.dose,
                        administrationMethod: dto.deworming.administrationMethod,
                        nextDueAt: dto.deworming.nextDueAt
                            ? new Date(dto.deworming.nextDueAt)
                            : undefined,
                        notes: dto.deworming.notes,
                    },
                },
            },
            include: {
                examination: true,
                vaccination: true,
                deworming: true,
                labResult: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }
};
MedicalRecordsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], MedicalRecordsService);
export { MedicalRecordsService };
//# sourceMappingURL=medical-records.service.js.map