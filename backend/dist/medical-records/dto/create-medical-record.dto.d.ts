import { DewormingType, MedicalRecordType } from '@prisma/client';
export declare class CreateExaminationDto {
    reason?: string;
    symptoms?: string;
    clinicalFindings?: string;
    diagnosis?: string;
    recommendations?: string;
    weightKg?: number;
    temperatureC?: number;
}
export declare class CreateVaccinationDto {
    vaccineName: string;
    manufacturer?: string;
    batchNumber?: string;
    administeredAt: string;
    nextDueAt?: string;
    validUntil?: string;
    notes?: string;
}
export declare class CreateDewormingDto {
    productName: string;
    manufacturer?: string;
    batchNumber?: string;
    dewormingType: DewormingType;
    administeredAt: string;
    dose?: string;
    administrationMethod?: string;
    nextDueAt?: string;
    notes?: string;
}
export declare class CreateLabResultDto {
    testName: string;
    result?: string;
    conclusion?: string;
    performedAt?: string;
    laboratory?: string;
}
export declare class CreateMedicalRecordDto {
    type: MedicalRecordType;
    title: string;
    notes?: string;
    occurredAt: string;
    examination?: CreateExaminationDto;
    vaccination?: CreateVaccinationDto;
    deworming?: CreateDewormingDto;
    labResult?: CreateLabResultDto;
}
