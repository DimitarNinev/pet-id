import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { AnimalsService } from '../../../core/services/animals.service';
import { Animal } from '../../../models/animal.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppButtonComponent } from '../../../components/app-button/app-button';
import { AppCalendarComponent } from '../../../components/app-calendar/app-calendar';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { HeaderComponent } from '../../../components/header/header.component';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';

const notBlankValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length === 0
    ? { required: true }
    : null;

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-new-records',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
    AppInputComponent,
    AppCalendarComponent,
    AppButtonComponent,
  ],
  templateUrl: './new-records.component.html',
  styleUrl: './new-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRecordsComponent implements OnInit {
  private readonly animalsService = inject(AnimalsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly medicalRecordsService = inject(MedicalRecordsService);

  animalId = '';
  isSaving = false;
  saveError = '';

  readonly animals = signal<Animal[]>([]);
  readonly isLoadingAnimals = signal(false);
  readonly animalLoadError = signal('');

  readonly recordForm = this.formBuilder.nonNullable.group({
    title: [
      '',
      [Validators.required, notBlankValidator, Validators.maxLength(200)],
    ],
    occurredAt: [toLocalDateInputValue(new Date()), Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.animalId = this.route.snapshot.paramMap.get('animalId') ?? '';

    if (!this.animalId) {
      this.loadAnimals();
    }
  }

  loadAnimals(): void {
    this.isLoadingAnimals.set(true);
    this.animalLoadError.set('');

    this.animalsService
      .getAll()
      .pipe(
        finalize(() => this.isLoadingAnimals.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.animals.set(data),
        error: () => {
          this.animalLoadError.set(
            'Не успяхме да заредим животните. Опитай отново.',
          );
        },
      });
  }

  selectAnimal(animalId: string): void {
    this.router.navigate([
      '/animals',
      animalId,
      'medical-records',
      'new',
    ]);
  }

  addAnimal(): void {
    this.router.navigate(['/animals/new']);
  }

  createRecord(): void {
    if (this.isSaving) return;

    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    if (!this.animalId) {
      this.saveError = 'Липсва идентификатор на животното.';
      return;
    }

    const formValue = this.recordForm.getRawValue();
    const occurredAt = new Date(`${formValue.occurredAt}T12:00:00`);

    if (Number.isNaN(occurredAt.getTime())) {
      this.saveError = 'Моля, избери валидна дата.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    this.medicalRecordsService
      .create(this.animalId, {
        type: 'OWNER_NOTE',
        title: formValue.title.trim(),
        notes: formValue.notes.trim() || undefined,
        occurredAt: occurredAt.toISOString(),
      })
      .pipe(
        finalize(() => (this.isSaving = false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.router.navigate([
            '/animals',
            this.animalId,
            'medical-records',
          ]);
        },
        error: (error: unknown) => {
          console.error('[NewRecords] POST error:', error);
          this.saveError = this.getSaveErrorMessage(error);
        },
      });
  }

  cancel(): void {
    if (!this.animalId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.router.navigate([
      '/animals',
      this.animalId,
      'medical-records',
    ]);
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

      if (error.status === 404) {
        return 'Животното не е намерено.';
      }
    }

    return 'Бележката не можа да бъде запазена.';
  }
}
