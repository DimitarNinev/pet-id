import { AnimalsService } from './animals.service.js';
interface AuthenticatedRequest {
    user: {
        sub: string;
        email: string;
        role: 'OWNER' | 'VET' | 'ADMIN';
    };
}
interface CreateAnimalBody {
    name: string;
    species: string;
    breed?: string;
    sex?: string;
    dateOfBirth?: string;
    microchipId?: string;
    notes?: string;
}
interface UpdateAnimalBody {
    name?: string;
    species?: string;
    breed?: string | null;
    sex?: string | null;
    dateOfBirth?: string | null;
    microchipId?: string | null;
    notes?: string | null;
}
export declare class AnimalsController {
    private readonly animalsService;
    constructor(animalsService: AnimalsService);
    findAll(request: AuthenticatedRequest): Promise<{
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
    create(request: AuthenticatedRequest, body: CreateAnimalBody): Promise<{
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
    searchForVet(request: AuthenticatedRequest, query: string): Promise<{
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
    uploadPhoto(request: AuthenticatedRequest, id: string, file?: Express.Multer.File): Promise<{
        id: string;
        photoPath: string | null;
    }>;
    getPhotoUrl(request: AuthenticatedRequest, id: string): Promise<{
        photoUrl: string;
    }>;
    getPhotoUrlForVet(request: AuthenticatedRequest, id: string): Promise<{
        photoUrl: string;
    }>;
    findOne(request: AuthenticatedRequest, id: string): Promise<{
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
    update(request: AuthenticatedRequest, id: string, body: UpdateAnimalBody): Promise<{
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
    remove(request: AuthenticatedRequest, id: string): Promise<{
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
export {};
