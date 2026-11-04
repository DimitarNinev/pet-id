
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
  selector: 'app-examination-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppCalendarComponent,
    AppButtonComponent,
    HeaderComponent,
  ],
  templateUrl: './examination-form.component.html',
  styleUrl: './examination-form.component.scss',
})
export class ExaminationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly animalId = this.route.snapshot.paramMap.get('animalId');

  readonly patient = signal<Patient | null>(
    history.state?.animal ?? null,
  );

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly today = this.getToday();

  readonly examinationForm = this.fb.group({
    occurredAt: [this.today, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
    symptoms: ['', Validators.maxLength(2000)],
    clinicalFindings: ['', Validators.maxLength(3000)],
    diagnosis: ['', Validators.maxLength(2000)],
    recommendations: ['', Validators.maxLength(3000)],
    weightKg: ['', Validators.pattern(/^\d+(\.\d+)?$/)],
    temperatureC: ['', Validators.pattern(/^\d+(\.\d+)?$/)],
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
    if (this.isSubmitting()) {
      return;
    }

    if (!this.animalId) {
      this.errorMessage.set('Липсва идентификатор на пациента.');
      return;
    }

    if (!this.patient() || this.patient()?.id !== this.animalId) {
      this.errorMessage.set('Информацията за пациента липсва. Върни се към търсенето и отвори пациента отново.');
      return;
    }

    if (this.examinationForm.invalid) {
      this.examinationForm.markAllAsTouched();
      this.errorMessage.set('Провери задължителните полета.');
      return;
    }

    const form = this.examinationForm.getRawValue();

    const weight = form.weightKg === '' ? undefined : Number(form.weightKg);
    const temperature =
      form.temperatureC === '' ? undefined : Number(form.temperatureC);

    if (
      (weight !== undefined && (!Number.isFinite(weight) || weight < 0)) ||
      (temperature !== undefined && !Number.isFinite(temperature))
    ) {
      this.errorMessage.set('Въведи валидни числови стойности.');
      return;
    }

    const payload: CreateVeterinaryMedicalRecord = {
      type: 'EXAMINATION',
      title: 'Ветеринарен преглед',
      occurredAt: `${form.occurredAt}T12:00:00.000Z`,
      examination: {
        reason: form.reason?.trim() || undefined,
        symptoms: form.symptoms?.trim() || undefined,
        clinicalFindings: form.clinicalFindings?.trim() || undefined,
        diagnosis: form.diagnosis?.trim() || undefined,
        recommendations: form.recommendations?.trim() || undefined,
        weightKg: weight,
        temperatureC: temperature,
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
          this.successMessage.set('✓ Прегледът е записан успешно.');
          this.examinationForm.reset({
            occurredAt: this.today,
            reason: '',
            symptoms: '',
            clinicalFindings: '',
            diagnosis: '',
            recommendations: '',
            weightKg: '',
            temperatureC: '',
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
              '! Нямаш право да създаваш медицински записи.',
            );
          } else if (error.status === 404) {
            this.errorMessage.set('! Пациентът не е намерен.');
          } else if (error.status === 400) {
            this.errorMessage.set(
              '! Данните не са валидни. Провери попълнените полета.',
            );
          } else {
            this.errorMessage.set(
              '! Възникна грешка при записването. Опитай отново.',
            );
          }
        },
      });
  }
}
