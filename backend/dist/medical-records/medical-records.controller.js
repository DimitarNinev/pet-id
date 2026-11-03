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
import { Body, Controller, Get, Param, Post, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto.js';
let MedicalRecordsController = class MedicalRecordsController {
    medicalRecordsService;
    constructor(medicalRecordsService) {
        this.medicalRecordsService = medicalRecordsService;
    }
    findAll(request, animalId) {
        return this.medicalRecordsService.findAll(request.user.sub, animalId);
    }
    create(request, animalId, dto) {
        return this.medicalRecordsService.create(request.user.sub, animalId, dto);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __param(1, Param('animalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "findAll", null);
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Param('animalId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateMedicalRecordDto]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "create", null);
MedicalRecordsController = __decorate([
    Controller('api/v1/animals/:animalId/medical-records'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [MedicalRecordsService])
], MedicalRecordsController);
export { MedicalRecordsController };
//# sourceMappingURL=medical-records.controller.js.map