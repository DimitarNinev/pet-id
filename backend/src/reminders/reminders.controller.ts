import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { RemindersService } from './reminders.service.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
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
  ) { }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.remindersService.findAll(request.user.sub);
  }

  @Post()
  create(
    @Body() dto: CreateReminderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.remindersService.create(
      request.user.sub,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.remindersService.remove(request.user.sub, id);
  }
}