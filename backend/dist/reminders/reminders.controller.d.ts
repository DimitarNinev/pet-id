import type { Request } from 'express';
import { RemindersService } from './reminders.service.js';
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
    })[]>;
}
export {};
