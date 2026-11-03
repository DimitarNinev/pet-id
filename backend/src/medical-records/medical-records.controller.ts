import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto.js';

interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
        role: 'OWNER' | 'VET' | 'ADMIN';
    };
}

@Controller('api/v1/animals/:animalId/medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
    constructor(
        private readonly medicalRecordsService: MedicalRecordsService,
    ) { }

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Param('animalId') animalId: string,
    ) {
        return this.medicalRecordsService.findAll(
            request.user.sub,
            animalId,
        );
    }

    @Post()
    create(
        @Req() request: AuthenticatedRequest,
        @Param('animalId') animalId: string,
        @Body() dto: CreateMedicalRecordDto,
    ) {
        return this.medicalRecordsService.create(
            request.user.sub,
            animalId,
            dto,
        );
    }
}
