var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AnimalsController } from './animals.controller.js';
import { AnimalsService } from './animals.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SupabaseStorageService } from './supabase-storage.service.js';
let AnimalsModule = class AnimalsModule {
};
AnimalsModule = __decorate([
    Module({
        imports: [PrismaModule, AuthModule],
        controllers: [AnimalsController],
        providers: [AnimalsService, SupabaseStorageService],
    })
], AnimalsModule);
export { AnimalsModule };
//# sourceMappingURL=animals.module.js.map