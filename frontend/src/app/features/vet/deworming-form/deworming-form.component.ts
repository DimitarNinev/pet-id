import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AppInputComponent } from '../../../components/app-input/app-input';
import { AppDropdownComponent } from '../../../components/app-dropdown/app-dropdown';
import { AppCalendarComponent } from '../../../components/app-calendar/app-calendar';
import { AppButtonComponent } from '../../../components/app-button/app-button';
import { HeaderComponent } from '../../../components/header/header.component';

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
  selector: 'app-deworming-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppDropdownComponent,
    AppCalendarComponent,
    AppButtonComponent,
    HeaderComponent,
  ],
  templateUrl: './deworming-form.component.html',
  styleUrl: './deworming-form.component.scss',
})
export class DewormingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly animalId = this.route.snapshot.paramMap.get('animalId');
  readonly patient = signal<Patient | null>(history.state?.animal ?? null);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly today = this.getToday();

  readonly dewormingForm = this.fb.group({
    productName: ['', [Validators.required, Validators.maxLength(150)]],
    manufacturer: ['', Validators.maxLength(150)],
    batchNumber: ['', Validators.maxLength(100)],
    dewormingType: ['INTERNAL', Validators.required],
    administeredAt: [this.today, Validators.required],
    dose: ['', Validators.maxLength(150)],
    administrationMethod: ['', Validators.maxLength(100)],
    nextDueAt: [''],
    notes: ['', Validators.maxLength(2000)],
  });

  readonly dewormingTypes = [
    { label: 'Вътрешно обезпаразитяване', value: 'INTERNAL' },
    { label: 'Външно обезпаразитяване', value: 'EXTERNAL' },
  ];

  private getToday(): string {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

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
      this.errorMessage.set('Липсва идентификатор на животното.');
      return;
    }

    if (!this.patient()) {
      this.errorMessage.set('Информацията за животното не е намерена. Моля, потърсете го отново.');
      return;
    }

    if (this.dewormingForm.invalid) {
      this.dewormingForm.markAllAsTouched();
      this.errorMessage.set('Моля, попълнете задължителните полета.');
      return;
    }

    const token = localStorage.getItem('pet-id-access-token');

    if (!token) {
      this.errorMessage.set('Сесията е изтекла. Моля, влезте отново.');
      return;
    }

    const form = this.dewormingForm.getRawValue();

    if (form.nextDueAt && form.nextDueAt < form.administeredAt!) {
      this.errorMessage.set(
        'Следващата дата за обезпаразитяване не може да бъде преди датата на приложение.',
      );
      return;
    }

    const payload = {
      type: 'DEWORMING',
      title: `Обезпаразитяване: ${form.productName!.trim()}`,
      occurredAt: `${form.administeredAt}T12:00:00.000Z`,
      deworming: {
        productName: form.productName!.trim(),
        manufacturer: form.manufacturer?.trim() || undefined,
        batchNumber: form.batchNumber?.trim() || undefined,
        dewormingType: form.dewormingType,
        administeredAt: `${form.administeredAt}T12:00:00.000Z`,
        dose: form.dose?.trim() || undefined,
        administrationMethod: form.administrationMethod?.trim() || undefined,
        nextDueAt: form.nextDueAt
          ? `${form.nextDueAt}T12:00:00.000Z`
          : undefined,
        notes: form.notes?.trim() || undefined,
      },
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http
      .post(
        `${'http://localhost:3000/api/v1/animals'}/${this.animalId}/medical-records`,
        payload,
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
        },
      )
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set(
            '✓ Обезпаразитяването е записано успешно.',
          );

          this.dewormingForm.reset({
            productName: '',
            manufacturer: '',
            batchNumber: '',
            dewormingType: 'INTERNAL',
            administeredAt: this.today,
            dose: '',
            administrationMethod: '',
            nextDueAt: '',
            notes: '',
          });

          setTimeout(() => {
            this.cancel();
          }, 2500);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage.set('Сесията е изтекла. Моля, влезте отново.');
          } else if (error.status === 403) {
            this.errorMessage.set('Нямате права за създаване на този запис.');
          } else if (error.status === 404) {
            this.errorMessage.set('Животното не е намерено.');
          } else if (error.status === 400) {
            this.errorMessage.set(
              error.error?.message || 'Невалидни данни. Проверете попълнените полета.',
            );
          } else {
            this.errorMessage.set(
              'Възникна грешка при записването. Моля, опитайте отново.',
            );
          }
        },
      });
  }
}