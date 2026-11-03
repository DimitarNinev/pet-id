import { PrismaService } from '../prisma/prisma.service.js';
type ReminderStatus = 'UPCOMING' | 'OVERDUE';
export declare class RemindersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        id: string;
        animalId: string;
        animalName: string;
        petId: string;
        type: "VACCINATION";
        title: string;
        dueAt: string;
        status: ReminderStatus;
    } | {
        id: string;
        animalId: string;
        animalName: string;
        petId: string;
        type: "DEWORMING";
        title: string;
        dewormingType: import("@prisma/client").$Enums.DewormingType;
        dueAt: string;
        status: ReminderStatus;
    })[]>;
    private getStatus;
}
export {};
