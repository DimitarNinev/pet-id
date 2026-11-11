import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
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
        source: "MEDICAL";
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
        source: "MEDICAL";
    } | {
        id: string;
        animalId: string;
        animalName: string;
        petId: string;
        source: "PERSONAL";
        type: "PERSONAL";
        title: string;
        description: string | null;
        dueAt: string;
        status: ReminderStatus | "COMPLETED" | "CANCELLED";
    })[]>;
    create(userId: string, dto: CreateReminderDto): Promise<{
        animal: {
            id: string;
            petId: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        animalId: string;
        title: string;
        description: string | null;
        dueAt: Date;
        status: import("@prisma/client").$Enums.ReminderStatus;
    }>;
    remove(userId: string, reminderId: string): Promise<{
        message: string;
    }>;
    private getStatus;
}
export {};
