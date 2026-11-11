import type { Request } from 'express';
import { RemindersService } from './reminders.service.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
        role: 'OWNER' | 'VET' | 'ADMIN';
    };
}
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    findAll(request: AuthenticatedRequest): Promise<({
        id: string;
        animalId: string;
        animalName: string;
        petId: string;
        type: "VACCINATION";
        title: string;
        dueAt: string;
        status: "UPCOMING" | "OVERDUE";
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
        status: "UPCOMING" | "OVERDUE";
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
        status: ("UPCOMING" | "OVERDUE") | "COMPLETED" | "CANCELLED";
    })[]>;
    create(dto: CreateReminderDto, request: AuthenticatedRequest): Promise<{
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
    remove(request: AuthenticatedRequest, id: string): Promise<{
        message: string;
    }>;
}
export {};
