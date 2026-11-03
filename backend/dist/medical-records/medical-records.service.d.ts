import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto.js';
export declare class MedicalRecordsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getUser;
    private getAnimal;
    findAll(userId: string, animalId: string): Promise<({
        organization: {
            id: string;
            name: string;
        } | null;
        examination: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            symptoms: string | null;
            clinicalFindings: string | null;
            diagnosis: string | null;
            recommendations: string | null;
            weightKg: number | null;
            temperatureC: number | null;
            medicalRecordId: string;
        } | null;
        vaccination: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            vaccineName: string;
            manufacturer: string | null;
            batchNumber: string | null;
            administeredAt: Date;
            nextDueAt: Date | null;
            validUntil: Date | null;
            medicalRecordId: string;
        } | null;
        deworming: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            manufacturer: string | null;
            batchNumber: string | null;
            administeredAt: Date;
            nextDueAt: Date | null;
            productName: string;
            dewormingType: import("@prisma/client").$Enums.DewormingType;
            dose: string | null;
            administrationMethod: string | null;
            medicalRecordId: string;
        } | null;
        labResult: {
            result: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            testName: string;
            conclusion: string | null;
            performedAt: Date | null;
            laboratory: string | null;
            medicalRecordId: string;
        } | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        animalId: string;
        createdById: string;
        organizationId: string | null;
        type: import("@prisma/client").$Enums.MedicalRecordType;
        title: string;
        occurredAt: Date;
    })[]>;
    create(userId: string, animalId: string, dto: CreateMedicalRecordDto): Promise<{
        examination: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            symptoms: string | null;
            clinicalFindings: string | null;
            diagnosis: string | null;
            recommendations: string | null;
            weightKg: number | null;
            temperatureC: number | null;
            medicalRecordId: string;
        } | null;
        vaccination: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            vaccineName: string;
            manufacturer: string | null;
            batchNumber: string | null;
            administeredAt: Date;
            nextDueAt: Date | null;
            validUntil: Date | null;
            medicalRecordId: string;
        } | null;
        deworming: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            manufacturer: string | null;
            batchNumber: string | null;
            administeredAt: Date;
            nextDueAt: Date | null;
            productName: string;
            dewormingType: import("@prisma/client").$Enums.DewormingType;
            dose: string | null;
            administrationMethod: string | null;
            medicalRecordId: string;
        } | null;
        labResult: {
            result: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            testName: string;
            conclusion: string | null;
            performedAt: Date | null;
            laboratory: string | null;
            medicalRecordId: string;
        } | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        animalId: string;
        createdById: string;
        organizationId: string | null;
        type: import("@prisma/client").$Enums.MedicalRecordType;
        title: string;
        occurredAt: Date;
    }>;
}
