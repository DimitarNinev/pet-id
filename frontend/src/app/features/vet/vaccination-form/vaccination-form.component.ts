import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timer } from 'rxjs';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { AppCalendarComponent } from '../../../components/app-calendar/app-calendar';
import { AppButtonComponent } from '../../../components/app-button/app-button';
import { HeaderComponent } from '../../../components/header/header.component';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import type { CreateVeterinaryMedicalRecord } from '../../../core/services/medical-records.service';

interface Patient {
  id: string;
  petId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  microchipId: string | null;
}

@Component({
  selector: 'app-vaccination-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppCalendarComponent,
    AppButtonComponent,
    HeaderComponent,
  ],
  templateUrl: './vaccination-form.component.html',
  styleUrl: './vaccination-form.component.scss',
})
export class VaccinationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly animalId = this.route.snapshot.paramMap.get('animalId');
  readonly patient = signal<Patient | null>(history.state?.animal ?? null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly today = this.getToday();

  readonly vaccinationForm = this.fb.group({
    vaccineName: ['', [Validators.required, Validators.maxLength(150)]],
    manufacturer: ['', Validators.maxLength(150)],
    batchNumber: ['', Validators.maxLength(100)],
    administeredAt: [this.today, Validators.required],
    nextDueAt: [''],
    validUntil: [''],
    notes: ['', Validators.maxLength(2000)],
  });

  private getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  cancel(): void {
    const previousState = history.state;

    this.router.navigate(['/vet/search'], {
      state: {
        animal: previousState?.animal ?? null,
        searchQuery: previousState?.searchQuery ?? '',
      },
    });
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.animalId) {
      this.errorMessage.set('Липсва идентификатор на пациента.');
      return;
    }

    if (!this.patient() || this.patient()?.id !== this.animalId) {
      this.errorMessage.set(
        'Информацията за пациента липсва. Върни се към търсенето и отвори пациента отново.',
      );
      return;
    }

    if (this.vaccinationForm.invalid) {
      this.vaccinationForm.markAllAsTouched();
      this.errorMessage.set('Попълни задължителните полета.');
      return;
    }

    const form = this.vaccinationForm.getRawValue();

    if (
      form.nextDueAt &&
      form.nextDueAt < form.administeredAt!
    ) {
      this.errorMessage.set(
        'Датата за следваща доза не може да е преди датата на поставяне.',
      );
      return;
    }

    if (
      form.validUntil &&
      form.validUntil < form.administeredAt!
    ) {
      this.errorMessage.set(
        'Датата на валидност не може да е преди датата на поставяне.',
      );
      return;
    }

    const payload: CreateVeterinaryMedicalRecord = {
      type: 'VACCINATION',
      title: `Ваксинация: ${form.vaccineName?.trim()}`,
      occurredAt: `${form.administeredAt}T12:00:00.000Z`,
      vaccination: {
        vaccineName: form.vaccineName?.trim(),
        manufacturer: form.manufacturer?.trim() || undefined,
        batchNumber: form.batchNumber?.trim() || undefined,
        administeredAt: `${form.administeredAt}T12:00:00.000Z`,
        nextDueAt: form.nextDueAt
          ? `${form.nextDueAt}T12:00:00.000Z`
          : undefined,
        validUntil: form.validUntil
          ? `${form.validUntil}T12:00:00.000Z`
          : undefined,
        notes: form.notes?.trim() || undefined,
      },
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.medicalRecordsService
      .createVeterinaryRecord(this.animalId, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('✓ Ваксинацията е записана успешно.');
          this.vaccinationForm.reset({
            vaccineName: '',
            manufacturer: '',
            batchNumber: '',
            administeredAt: this.today,
            nextDueAt: '',
            validUntil: '',
            notes: '',
          });

          timer(2500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.cancel();
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage.set('! Сесията ти е изтекла. Влез отново.');
          } else if (error.status === 403) {
            this.errorMessage.set(
              '! Само одобрен ветеринар може да записва ваксинации.',
            );
          } else if (error.status === 404) {
            this.errorMessage.set('! Пациентът не е намерен.');
          } else if (error.status === 400) {
            this.errorMessage.set(
              '! Данните не са валидни. Провери попълнените полета.',
            );
          } else {
            this.errorMessage.set(
              '! Възникна грешка при записването на ваксинацията.',
            );
          }
        },
      });
  }
}
