import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SupabaseStorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ??
      'animal-photos';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Storage configuration is missing.');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey);
  }

  async uploadAnimalPhoto(
    userId: string,
    animalId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const extension = extensionByMimeType[file.mimetype];

    if (!extension) {
      throw new InternalServerErrorException(
        'Неподдържан формат на изображението.',
      );
    }

    const filePath = `${userId}/${animalId}/${randomUUID()}.${extension}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        'Неуспешно качване на снимката.',
      );
    }

    return filePath;
  }

  async createSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, 60 * 60);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        'Снимката не може да бъде заредена.',
      );
    }

    return data.signedUrl;
  }

  async deletePhoto(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      throw new InternalServerErrorException(
        'Неуспешно изтриване на старата снимка.',
      );
    }
  }
}