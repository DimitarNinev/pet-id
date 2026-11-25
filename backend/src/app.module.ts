import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AnimalsModule } from './animals/animals.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MedicalRecordsModule } from './medical-records/medical-records.module.js';
import { RemindersModule } from './reminders/reminders.module.js';
import { VetsModule } from './vets/vets.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AnimalsModule,
    AuthModule,
    MedicalRecordsModule,
    RemindersModule,
    VetsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
