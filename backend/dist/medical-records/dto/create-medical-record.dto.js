var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested, } from 'class-validator';
import { Type } from 'class-transformer';
import { DewormingType, MedicalRecordType } from '@prisma/client';
export class CreateExaminationDto {
    reason;
    symptoms;
    clinicalFindings;
    diagnosis;
    recommendations;
    weightKg;
    temperatureC;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExaminationDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExaminationDto.prototype, "symptoms", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExaminationDto.prototype, "clinicalFindings", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExaminationDto.prototype, "diagnosis", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateExaminationDto.prototype, "recommendations", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateExaminationDto.prototype, "weightKg", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateExaminationDto.prototype, "temperatureC", void 0);
export class CreateVaccinationDto {
    vaccineName;
    manufacturer;
    batchNumber;
    administeredAt;
    nextDueAt;
    validUntil;
    notes;
}
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "vaccineName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "manufacturer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "batchNumber", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "administeredAt", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "nextDueAt", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "validUntil", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateVaccinationDto.prototype, "notes", void 0);
export class CreateDewormingDto {
    productName;
    manufacturer;
    batchNumber;
    dewormingType;
    administeredAt;
    dose;
    administrationMethod;
    nextDueAt;
    notes;
}
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "productName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "manufacturer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "batchNumber", void 0);
__decorate([
    IsEnum(DewormingType),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "dewormingType", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "administeredAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "dose", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "administrationMethod", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "nextDueAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDewormingDto.prototype, "notes", void 0);
export class CreateLabResultDto {
    testName;
    result;
    conclusion;
    performedAt;
    laboratory;
}
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "testName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "result", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "conclusion", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "performedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLabResultDto.prototype, "laboratory", void 0);
export class CreateMedicalRecordDto {
    type;
    title;
    notes;
    occurredAt;
    examination;
    vaccination;
    deworming;
    labResult;
}
__decorate([
    IsEnum(MedicalRecordType),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "type", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "notes", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], CreateMedicalRecordDto.prototype, "occurredAt", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    Type(() => CreateExaminationDto),
    __metadata("design:type", CreateExaminationDto)
], CreateMedicalRecordDto.prototype, "examination", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    Type(() => CreateVaccinationDto),
    __metadata("design:type", CreateVaccinationDto)
], CreateMedicalRecordDto.prototype, "vaccination", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    Type(() => CreateDewormingDto),
    __metadata("design:type", CreateDewormingDto)
], CreateMedicalRecordDto.prototype, "deworming", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    Type(() => CreateLabResultDto),
    __metadata("design:type", CreateLabResultDto)
], CreateMedicalRecordDto.prototype, "labResult", void 0);
//# sourceMappingURL=create-medical-record.dto.js.map