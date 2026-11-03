import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RemindersService } from './reminders.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
  };
}

@Controller('api/v1/reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
  ) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.remindersService.findAll(request.user.sub);
  }
}