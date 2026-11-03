import { ConfigService } from '@nestjs/config';
export declare class SupabaseStorageService {
    private readonly configService;
    private readonly supabase;
    private readonly bucket;
    constructor(configService: ConfigService);
    uploadAnimalPhoto(userId: string, animalId: string, file: Express.Multer.File): Promise<string>;
    createSignedUrl(filePath: string): Promise<string>;
    deletePhoto(filePath: string): Promise<void>;
}
