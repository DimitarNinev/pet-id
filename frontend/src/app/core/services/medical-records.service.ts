import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export type MedicalRecordType =
  | 'OWNER_NOTE'
  | 'EXAMINATION'
  | 'VACCINATION'
  | 'DEWORMING'
  | 'LAB_RESULT'
  | 'TREATMENT'
  | 'PROCEDURE'
  | 'OTHER';


export interface ExaminationDetails {
  id: string;
  medicalRecordId: string;
  reason: string | null;
  symptoms: string | null;
  clinicalFindings: string | null;
  diagnosis: string | null;
  recommendations: string | null;
  weightKg: number | null;
  temperatureC: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaccinationDetails {
  id?: string;
  vaccineName: string;
  manufacturer: string | null;
  batchNumber: string | null;
  administeredAt: string;
  nextDueAt: string | null;
  validUntil: string | null;
  notes: string | null;
}

export interface DewormingDetails {
  id: string;
  medicalRecordId: string;
  productName: string;
  manufacturer: string | null;
  batchNumber: string | null;
  dewormingType: 'INTERNAL' | 'EXTERNAL';
  administeredAt: string;
  dose: string | null;
  administrationMethod: string | null;
  nextDueAt: string | null;
  notes: string | null;
}

export interface MedicalRecord {
  id: string;
  animalId: string;
  createdById: string;
  type: MedicalRecordType;
  title: string;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;

  examination?: ExaminationDetails | null;
  vaccination?: VaccinationDetails | null;
  deworming?: DewormingDetails | null;

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'VET' | 'ADMIN';
  };

  organization?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateMedicalRecord {
  type: 'OWNER_NOTE';
  title: string;
  notes?: string;
  occurredAt: string;
}

export interface CreateVeterinaryMedicalRecord {
  type: 'EXAMINATION' | 'VACCINATION' | 'DEWORMING';
  title: string;
  occurredAt: string;
  examination?: Partial<ExaminationDetails>;
  vaccination?: Partial<VaccinationDetails>;
  deworming?: Partial<DewormingDetails>;
}

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/animals`;

  getByAnimalId(animalId: string): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(
      `${this.apiUrl}/${animalId}/medical-records`,
    );
  }

  create(
    animalId: string,
    data: CreateMedicalRecord,
  ): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(
      `${this.apiUrl}/${animalId}/medical-records`,
      data,
    );
  }

  createVeterinaryRecord(
    animalId: string,
    data: CreateVeterinaryMedicalRecord,
  ): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(
      `${this.apiUrl}/${animalId}/medical-records`,
      data,
    );
  }
}
