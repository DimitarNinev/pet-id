import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';

import { AppButtonComponent } from '../../../components/app-button/app-button';
import { AppCalendarComponent } from '../../../components/app-calendar/app-calendar';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { HeaderComponent } from '../../../components/header/header.component';
import {
  MedicalRecord,
  MedicalRecordType,
  MedicalRecordsService,
} from '../../../core/services/medical-records.service';

const notBlankValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length === 0
    ? { required: true }
    : null;

const recordTypeLabels: Record<MedicalRecordType, string> = {
  OWNER_NOTE: 'Лична бележка',
  EXAMINATION: 'Преглед',
  VACCINATION: 'Ваксинация',
  DEWORMING: 'Обезпаразитяване',
  LAB_RESULT: 'Лабораторен резултат',
  TREATMENT: 'Лечение',
  PROCEDURE: 'Процедура',
  OTHER: 'Друг запис',
};

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    HeaderComponent,
    AppInputComponent,
    AppCalendarComponent,
    AppButtonComponent
  ],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalRecordsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly medicalRecordsService = inject(MedicalRecordsService);

  readonly animalId = signal('');
  readonly records = signal<MedicalRecord[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly showCreateForm = signal(false);
  readonly isSaving = signal(false);
  readonly saveError = signal('');
  readonly saveSuccess = signal('');
  readonly userRole = signal('');

  readonly recordForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, notBlankValidator, Validators.maxLength(200)]],
    occurredAt: [toLocalDateInputValue(new Date()), Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('animalId') ?? ''),
        distinctUntilChanged(),
        tap((animalId) => {
          this.animalId.set(animalId);
          this.records.set([]);
          this.errorMessage.set('');
          this.saveError.set('');
          this.saveSuccess.set('');
          this.showCreateForm.set(false);
          this.recordForm.reset({
            title: '',
            occurredAt: toLocalDateInputValue(new Date()),
            notes: '',
          });
        }),
        switchMap((animalId) => {
          if (!animalId) {
            this.isLoading.set(false);
            this.errorMessage.set('Липсва идентификатор на животното.');
            return EMPTY;
          }

          this.isLoading.set(true);

          return this.medicalRecordsService.getByAnimalId(animalId).pipe(
            tap((records) => this.records.set(records)),
            catchError((error: unknown) => {
              console.error('[MedicalRecords] GET error:', error);
              this.errorMessage.set(this.getLoadErrorMessage(error));
              return EMPTY;
            }),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    const user = localStorage.getItem('user-role');
    this.userRole.set(user!);
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((show) => !show);
  }

  createRecord(): void {
    if (this.isSaving()) return;

    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const animalId = this.animalId();
    const formValue = this.recordForm.getRawValue();
    const occurredAt = new Date(`${formValue.occurredAt}T12:00:00`);

    if (!animalId) {
      this.saveError.set('Липсва идентификатор на животното.');
      return;
    }

    if (Number.isNaN(occurredAt.getTime())) {
      this.saveError.set('Моля, избери валидна дата.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');

    this.medicalRecordsService
      .create(animalId, {
        type: 'OWNER_NOTE',
        title: formValue.title.trim(),
        notes: formValue.notes.trim() || undefined,
        occurredAt: occurredAt.toISOString(),
      })
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (record) => {
          if (animalId !== this.animalId()) return;

          this.records.update((records) => [record, ...records]);
          this.saveSuccess.set('Бележката е добавена успешно.');
          this.recordForm.reset({
            title: '',
            occurredAt: toLocalDateInputValue(new Date()),
            notes: '',
          });
          this.showCreateForm.set(false);
        },
        error: (error: unknown) => {
          if (animalId !== this.animalId()) return;
          console.error('[MedicalRecords] POST error:', error);
          this.saveError.set(this.getSaveErrorMessage(error));
        },
      });
  }

  loadRecords(): void {
    const animalId = this.animalId();
    if (!animalId) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.medicalRecordsService
      .getByAnimalId(animalId)
      .pipe(
        finalize(() => {
          if (animalId === this.animalId()) this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (records) => {
          if (animalId === this.animalId()) this.records.set(records);
        },
        error: (error: unknown) => {
          if (animalId !== this.animalId()) return;
          console.error('[MedicalRecords] GET error:', error);
          this.errorMessage.set(this.getLoadErrorMessage(error));
        },
      });
  }

  getRecordTypeLabel(type: MedicalRecordType): string {
    return recordTypeLabels[type] ?? 'Друг запис';
  }

  private getLoadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Няма връзка със сървъра. Опитай отново.';
      }
      if (error.status === 401) {
        return 'Сесията ти е изтекла. Влез отново в профила си.';
      }
      if (error.status === 404) {
        return 'Животното не е намерено.';
      }
    }

    return 'Медицинската история не може да бъде заредена.';
  }

  private getSaveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Няма връзка със сървъра. Опитай отново.';
      }
      if (error.status === 401) {
        return 'Сесията ти е изтекла. Влез отново в профила си.';
      }
      if (error.status === 403) {
        return 'Нямаш право да добавиш запис за това животно.';
      }
    }

    return 'Бележката не можа да бъде запазена.';
  }

  navigate(): void {
    if (this.userRole() === 'OWNER') {
      this.router.navigate(['/animals', this.animalId()]);
      return;
    }

    const previousState = history.state;

    this.router.navigate(['/vet/search'], {
      state: {
        animal: previousState?.animal ?? null,
        searchQuery: previousState?.searchQuery ?? '',
      },
    });
  }
}