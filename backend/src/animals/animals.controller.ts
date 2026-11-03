import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Patch,
  Delete,
  UseGuards,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnimalsService } from './animals.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
  };
}

interface CreateAnimalBody {
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  dateOfBirth?: string;
  microchipId?: string;
  notes?: string;
}

interface UpdateAnimalBody {
  name?: string;
  species?: string;
  breed?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  microchipId?: string | null;
  notes?: string | null;
}

@Controller('api/v1/animals')
@UseGuards(JwtAuthGuard)
export class AnimalsController {
  constructor(
    private readonly animalsService: AnimalsService,
  ) { }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.animalsService.findAll(request.user.sub);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateAnimalBody,
  ) {
    return this.animalsService.create(request.user.sub, body);
  }

  @Get('search')
  searchForVet(
    @Req() request: AuthenticatedRequest,
    @Query('q') query: string,
  ) {
    return this.animalsService.searchForVet(
      request.user.sub,
      query ?? '',
    );
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Позволени са само JPEG, PNG и WebP изображения.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )

  uploadPhoto(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Моля, избери снимка.');
    }

    return this.animalsService.uploadPhoto(
      request.user.sub,
      id,
      file,
    );
  }

  @Get(':id/photo-url')
  getPhotoUrl(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.animalsService.getPhotoUrl(
      request.user.sub,
      id,
    );
  }

  @Get(':id/vet-photo-url')
  getPhotoUrlForVet(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.animalsService.getPhotoUrlForVet(
      request.user.sub,
      id,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.animalsService.findOne(
      request.user.sub,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateAnimalBody,
  ) {
    return this.animalsService.update(
      request.user.sub,
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.animalsService.remove(request.user.sub, id);
  }
}
