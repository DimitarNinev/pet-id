import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { VetsService } from './vets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
  };
}

@Controller('api/v1/vets')
@UseGuards(JwtAuthGuard)
export class VetsController {
  constructor(private readonly vetsService: VetsService) { }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('q') query?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vetsService.findAll({
      userId: request.user.sub,
      query: query ?? '',
      city: city ?? '',
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }
}