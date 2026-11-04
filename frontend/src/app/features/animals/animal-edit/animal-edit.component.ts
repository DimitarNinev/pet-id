import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';


import { AnimalsService } from '../../../core/services/animals.service';
import { Animal, CreateAnimalDto } from '../../../models/animal.model';
import { AppInputComponent } from "../../../components/app-input/app-input";
import { AppDropdownComponent } from "../../../components/app-dropdown/app-dropdown";
import { AppButtonComponent } from "../../../components/app-button/app-button";
import { AppCalendarComponent } from "../../../components/app-calendar/app-calendar";
import { HeaderComponent } from "../../../components/header/header.component";
import { toDateInputValue } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-animal-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, AppInputComponent, AppDropdownComponent, AppButtonComponent, AppCalendarComponent],
  templateUrl: './animal-edit.component.html',
  styleUrl: './animal-edit.component.scss',
})
export class AnimalEditComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly animalsService = inject(AnimalsService);

  readonly animal = signal<Animal | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly photoUrl = signal<string | null>(null);
  readonly selectedPhoto = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal('');
  readonly isUploadingPhoto = signal(false);
  readonly isLoadingPhoto = signal(false);

  private readonly allowedPhotoTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly maxPhotoSize = 5 * 1024 * 1024;

  readonly today = toDateInputValue(new Date());

  readonly animalForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    species: ['', Validators.required],
    breed: [''],
    sex: [''],
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('Невалиден идентификатор на животното.');
      this.isLoading.set(false);
      return;
    }

    const navigationState = history.state as {
      animal?: Animal;
      photoUrl?: string | null;
    };

    const stateAnimal = navigationState.animal;

    // Проверяваме дали подаденото животно съответства на ID-то в URL.
    if (stateAnimal && stateAnimal.id === id) {
      this.setAnimalData(stateAnimal);

      const statePhotoUrl = navigationState.photoUrl;

      if (stateAnimal.photoPath && statePhotoUrl) {
        this.photoUrl.set(statePhotoUrl);
      } else if (stateAnimal.photoPath) {
        this.loadPhotoUrl(stateAnimal.id);
      }

      this.isLoading.set(false);
      return;
    }

    // Резервен вариант: директно отваряне или презареждане.
    this.loadAnimal(id);
  }

  private loadAnimal(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.animalsService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (animal) => {
        this.setAnimalData(animal);

        if (animal.photoPath) {
          this.loadPhotoUrl(animal.id);
        }

        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.status === 404
            ? 'Животното не е намерено или нямаш достъп до него.'
            : error.status === 401
              ? 'Сесията ти е изтекла. Влез отново.'
              : 'Неуспешно зареждане на животното.'
        );

        this.isLoading.set(false);
      },
    });
  }

  private setAnimalData(animal: Animal): void {
    this.animal.set(animal);

    this.animalForm.patchValue({
      name: animal.name,
      species: animal.species,
      breed: animal.breed ?? '',
      sex: animal.sex ?? '',
      dateOfBirth: animal.dateOfBirth
        ? animal.dateOfBirth.slice(0, 10)
        : '',
      microchipId: animal.microchipId ?? '',
      notes: animal.notes ?? '',
    });
  }

  onSubmit(): void {
    const animal = this.animal();

    if (!animal) {
      return;
    }

    if (this.animalForm.invalid || this.isSubmitting() || !animal) {
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

    const data: Partial<CreateAnimalDto> = {
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

    this.animalsService.update(animal.id, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedAnimal) => {
        this.isSubmitting.set(false);

        const updatedAnimalWithPhoto: Animal = {
          ...updatedAnimal,
          photoPath: updatedAnimal.photoPath ?? animal.photoPath,
        };

        void this.router.navigate(['/animals', animal.id], {
          state: {
            animal: updatedAnimalWithPhoto,
            photoUrl: this.photoUrl(),
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        this.errorMessage.set(error.status === 404
          ? 'Животното не е намерено или нямаш достъп до него.'
          : error.status === 409
            ? 'Този номер на микрочип вече е регистриран.'
            : error.status === 401
              ? 'Сесията ти е изтекла. Влез отново.'
              : typeof error.error?.message === 'string'
                ? error.error.message
                : 'Неуспешно записване на промените.');
      },
    });
  }

  private loadPhotoUrl(animalId: string): void {
    this.isLoadingPhoto.set(true);

    this.animalsService.getPhotoUrl(animalId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.photoUrl.set(response.photoUrl);
        this.isLoadingPhoto.set(false);
      },
      error: () => {
        this.photoUrl.set(null);
        this.isLoadingPhoto.set(false);
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

  uploadSelectedPhoto(): void {
    const animal = this.animal();
    const photo = this.selectedPhoto();

    if (!animal || !photo || this.isUploadingPhoto()) {
      return;
    }

    this.isUploadingPhoto.set(true);
    this.photoError.set('');

    this.animalsService.uploadPhoto(animal.id, photo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isUploadingPhoto.set(false);
        this.selectedPhoto.set(null);
        this.clearPhotoPreview();

        // Зареждаме нов подписан URL след успешната замяна.
        this.loadPhotoUrl(animal.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isUploadingPhoto.set(false);

        this.photoError.set(
          error.error?.message ||
          'Снимката не беше качена. Моля, опитай отново.'
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.clearPhotoPreview();
  }
}
