
import { Component, DestroyRef, inject, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AnimalsService } from '../../../core/services/animals.service';
import { CreateAnimalDto } from '../../../models/animal.model';
import { AppInputComponent } from "../../../components/app-input/app-input";
import { AppDropdownComponent } from "../../../components/app-dropdown/app-dropdown";
import { AppButtonComponent } from "../../../components/app-button/app-button";
import { AppCalendarComponent } from "../../../components/app-calendar/app-calendar";
import { HeaderComponent } from "../../../components/header/header.component";
import { toDateInputValue } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, AppInputComponent, AppDropdownComponent, AppButtonComponent, AppCalendarComponent],
  templateUrl: './animal-form.component.html',
  styleUrl: './animal-form.component.scss',
})
export class AnimalFormComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly animalsService = inject(AnimalsService);
  private readonly router = inject(Router);
  readonly today = toDateInputValue(new Date());

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly selectedPhoto = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal('');
  readonly createdAnimalId = signal<string | null>(null);

  private readonly allowedPhotoTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly maxPhotoSize = 5 * 1024 * 1024;

  readonly animalForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    species: ['Куче', Validators.required],
    breed: [''],
    sex: ['Не е посочен'],
    dateOfBirth: [''],
    microchipId: [''],
    notes: [''],
  });

  species = [
    { value: 'Куче', label: 'Куче' },
    { value: 'Котка', label: 'Котка' },
    { value: 'Друго', label: 'Друго' },
  ];

  sex = [
    { value: 'Не е посочен', label: 'Не е посочен' },
    { value: 'Мъжки', label: 'Мъжки' },
    { value: 'Женски', label: 'Женски' },
  ]

  get name() {
    return this.animalForm.controls.name;
  }

  onSubmit(): void {
    if (this.animalForm.invalid || this.isSubmitting()) {
      this.animalForm.markAllAsTouched();
      return;
    }

    const value = this.animalForm.getRawValue();

    const dateValue = value.dateOfBirth as unknown as Date | string | null;

    let formattedDate: string | undefined;

    if (dateValue) {
      const date =
        dateValue instanceof Date
          ? dateValue
          : new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        this.errorMessage.set('Моля, изберете валидна дата на раждане.');
        return;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      formattedDate = `${year}-${month}-${day}`;
    }

    const data: CreateAnimalDto = {
      name: value.name.trim(),
      species: value.species,
      breed: value.breed.trim() || undefined,
      sex: value.sex || undefined,
      dateOfBirth: formattedDate,
      microchipId: value.microchipId.trim() || undefined,
      notes: value.notes.trim() || undefined,
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.animalsService.create(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (animal) => {
        this.createdAnimalId.set(animal.id);

        const photo = this.selectedPhoto();

        if (!photo) {
          this.isSubmitting.set(false);
          void this.router.navigate(['/dashboard']);
          return;
        }

        this.uploadPhoto(animal.id, photo);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        if (error.status === 409) {
          this.errorMessage.set('Този номер на микрочип вече е регистриран.');
        } else if (error.status === 401) {
          this.errorMessage.set('Сесията ти е изтекла. Влез отново в профила си.');
        } else {
          this.errorMessage.set(error.error?.message ||
            'Неуспешно записване. Моля, опитай отново.');
        }
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.photoError.set('');

    if (!file) return;

    if (!this.allowedPhotoTypes.includes(file.type)) {
      this.photoError.set('Позволени са само JPEG, PNG и WebP изображения.');
      input.value = '';
      return;
    }

    if (file.size > this.maxPhotoSize) {
      this.photoError.set('Размерът на снимката не трябва да надвишава 5 MB.');
      input.value = '';
      return;
    }

    this.clearPhotoPreview();

    this.selectedPhoto.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  removeSelectedPhoto(): void {
    this.clearPhotoPreview();
    this.selectedPhoto.set(null);
    this.photoError.set('');
  }

  private clearPhotoPreview(): void {
    const currentPreview = this.photoPreview();

    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }

    this.photoPreview.set(null);
  }

  private uploadPhoto(animalId: string, photo: File): void {
    this.animalsService.uploadPhoto(animalId, photo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          'Животното е създадено успешно, но снимката не беше качена. Можеш да опиташ отново или да добавиш снимка по-късно.'
        );
      },
    });
  }

  retryPhotoUpload(): void {
    const animalId = this.createdAnimalId();
    const photo = this.selectedPhoto();

    if (!animalId || !photo || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.uploadPhoto(animalId, photo);
  }

  ngOnDestroy(): void {
    this.clearPhotoPreview();
  }
}
