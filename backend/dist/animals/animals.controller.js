var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Post, Req, Patch, Delete, UseGuards, Param, Query, UploadedFile, UseInterceptors, BadRequestException, } from '@nestjs/common';
import { AnimalsService } from './animals.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
let AnimalsController = class AnimalsController {
    animalsService;
    constructor(animalsService) {
        this.animalsService = animalsService;
    }
    findAll(request) {
        return this.animalsService.findAll(request.user.sub);
    }
    create(request, body) {
        return this.animalsService.create(request.user.sub, body);
    }
    searchForVet(request, query) {
        return this.animalsService.searchForVet(request.user.sub, query ?? '');
    }
    uploadPhoto(request, id, file) {
        if (!file) {
            throw new BadRequestException('Моля, избери снимка.');
        }
        return this.animalsService.uploadPhoto(request.user.sub, id, file);
    }
    getPhotoUrl(request, id) {
        return this.animalsService.getPhotoUrl(request.user.sub, id);
    }
    getPhotoUrlForVet(request, id) {
        return this.animalsService.getPhotoUrlForVet(request.user.sub, id);
    }
    findOne(request, id) {
        return this.animalsService.findOne(request.user.sub, id);
    }
    update(request, id, body) {
        return this.animalsService.update(request.user.sub, id, body);
    }
    remove(request, id) {
        return this.animalsService.remove(request.user.sub, id);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "findAll", null);
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "create", null);
__decorate([
    Get('search'),
    __param(0, Req()),
    __param(1, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "searchForVet", null);
__decorate([
    Post(':id/photo'),
    UseInterceptors(FileInterceptor('photo', {
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
                return callback(new BadRequestException('Позволени са само JPEG, PNG и WebP изображения.'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "uploadPhoto", null);
__decorate([
    Get(':id/photo-url'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "getPhotoUrl", null);
__decorate([
    Get(':id/vet-photo-url'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "getPhotoUrlForVet", null);
__decorate([
    Get(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnimalsController.prototype, "remove", null);
AnimalsController = __decorate([
    Controller('api/v1/animals'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AnimalsService])
], AnimalsController);
export { AnimalsController };
//# sourceMappingURL=animals.controller.js.map