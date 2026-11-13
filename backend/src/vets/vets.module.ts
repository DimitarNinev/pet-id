import { Module } from '@nestjs/common';
import { VetsController } from './vets.controller.js';
import { VetsService } from './vets.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VetsController],
  providers: [VetsService],
})
export class VetsModule {}