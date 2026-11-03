import { Module } from '@nestjs/common';
import { AnimalsController } from './animals.controller.js';
import { AnimalsService } from './animals.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SupabaseStorageService } from './supabase-storage.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnimalsController],
  providers: [AnimalsService, SupabaseStorageService],
})
export class AnimalsModule {}
