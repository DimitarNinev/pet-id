import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DewormingType, MedicalRecordType } from '@prisma/client';

export class CreateExaminationDto {
    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    symptoms?: string;

    @IsOptional()
    @IsString()
    clinicalFindings?: string;

    @IsOptional()
    @IsString()
    diagnosis?: string;

    @IsOptional()
    @IsString()
    recommendations?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weightKg?: number;

    @IsOptional()
    @IsNumber()
    temperatureC?: number;
}

export class CreateVaccinationDto {
    @IsString()
    @MaxLength(150)
    vaccineName!: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsString()
    batchNumber?: string;

    @IsDateString()
    administeredAt!: string;

    @IsOptional()
    @IsDateString()
    nextDueAt?: string;

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateDewormingDto {
    @IsString()
    @MaxLength(150)
    productName!: string;

    @IsOptional()
    @IsString()
    manufacturer?: string;

    @IsOptional()
    @IsString()
    batchNumber?: string;

    @IsEnum(DewormingType)
    dewormingType!: DewormingType;

    @IsDateString()
    administeredAt!: string;

    @IsOptional()
    @IsString()
    dose?: string;

    @IsOptional()
    @IsString()
    administrationMethod?: string;

    @IsOptional()
    @IsDateString()
    nextDueAt?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateLabResultDto {
    @IsString()
    @MaxLength(150)
    testName!: string;

    @IsOptional()
    @IsString()
    result?: string;

    @IsOptional()
    @IsString()
    conclusion?: string;

    @IsOptional()
    @IsDateString()
    performedAt?: string;

    @IsOptional()
    @IsString()
    laboratory?: string;
}

export class CreateMedicalRecordDto {
    @IsEnum(MedicalRecordType)
    type!: MedicalRecordType;

    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsDateString()
    occurredAt!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateExaminationDto)
    examination?: CreateExaminationDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateVaccinationDto)
    vaccination?: CreateVaccinationDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateDewormingDto)
    deworming?: CreateDewormingDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateLabResultDto)
    labResult?: CreateLabResultDto;
}
