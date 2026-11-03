import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseStorageService } from './supabase-storage.service.js';
export declare class AnimalsService {
    private readonly prisma;
    private readonly storageService;
    constructor(prisma: PrismaService, storageService: SupabaseStorageService);
    findAll(userId: string): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        notes: string | null;
        photoPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    searchForVet(vetUserId: string, query: string): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        photoPath: string | null;
        createdAt: Date;
    }>;
    create(userId: string, data: {
        name: string;
        species: string;
        breed?: string;
        sex?: string;
        dateOfBirth?: string;
        microchipId?: string;
        notes?: string;
    }): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        notes: string | null;
        photoPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(userId: string, animalId: string): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        notes: string | null;
        photoPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(userId: string, animalId: string, data: {
        name?: string;
        species?: string;
        breed?: string | null;
        sex?: string | null;
        dateOfBirth?: string | null;
        microchipId?: string | null;
        notes?: string | null;
    }): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        notes: string | null;
        photoPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    uploadPhoto(userId: string, animalId: string, file: Express.Multer.File): Promise<{
        id: string;
        photoPath: string | null;
    }>;
    getPhotoUrl(userId: string, animalId: string): Promise<{
        photoUrl: string;
    }>;
    getPhotoUrlForVet(vetUserId: string, animalId: string): Promise<{
        photoUrl: string;
    }>;
    remove(userId: string, animalId: string): Promise<{
        id: string;
        petId: string;
        name: string;
        species: string;
        breed: string | null;
        sex: string | null;
        dateOfBirth: Date | null;
        microchipId: string | null;
        notes: string | null;
        photoPath: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
