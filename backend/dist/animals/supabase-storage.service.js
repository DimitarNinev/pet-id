var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, InternalServerErrorException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
let SupabaseStorageService = class SupabaseStorageService {
    configService;
    supabase;
    bucket;
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        this.bucket =
            this.configService.get('SUPABASE_STORAGE_BUCKET') ??
                'animal-photos';
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase Storage configuration is missing.');
        }
        this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }
    async uploadAnimalPhoto(userId, animalId, file) {
        const extensionByMimeType = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        const extension = extensionByMimeType[file.mimetype];
        if (!extension) {
            throw new InternalServerErrorException('Неподдържан формат на изображението.');
        }
        const filePath = `${userId}/${animalId}/${randomUUID()}.${extension}`;
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            throw new InternalServerErrorException('Неуспешно качване на снимката.');
        }
        return filePath;
    }
    async createSignedUrl(filePath) {
        const { data, error } = await this.supabase.storage
            .from(this.bucket)
            .createSignedUrl(filePath, 60 * 60);
        if (error || !data?.signedUrl) {
            throw new InternalServerErrorException('Снимката не може да бъде заредена.');
        }
        return data.signedUrl;
    }
    async deletePhoto(filePath) {
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .remove([filePath]);
        if (error) {
            throw new InternalServerErrorException('Неуспешно изтриване на старата снимка.');
        }
    }
};
SupabaseStorageService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SupabaseStorageService);
export { SupabaseStorageService };
//# sourceMappingURL=supabase-storage.service.js.map