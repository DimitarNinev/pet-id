import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { AdminService } from './admin.service.js';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('statistics')
  getStatistics() {
    return this.adminService.getStatistics();
  }

  @Get('vets/pending')
  getPendingVets() {
    return this.adminService.getPendingVets();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('animals')
  getAnimals() {
    return this.adminService.getAnimals();
  }

  @Patch('vets/:id/approve')
  approveVet(@Param('id') id: string) {
    return this.adminService.approveVet(id);
  }
}