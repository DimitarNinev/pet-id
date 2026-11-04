import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { AnimalsService } from '../../../core/services/animals.service';
import type { Animal } from '../../../models/animal.model';
import { AppButtonComponent } from '../../../components/app-button/app-button';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
  selector: 'app-animal-details',
  standalone: true,
  imports: [DatePipe, RouterLink, AppButtonComponent, HeaderComponent],
  templateUrl: './animal-details.component.html',
  styleUrl: './animal-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalDetailsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly animalsService = inject(AnimalsService);
  private readonly router = inject(Router);
  private readonly reloadAnimal$ = new Subject<void>();
  private usedNavigationState = false;

  readonly animalId = signal('');
  readonly animal = signal<Animal | null>(null);
  readonly photoUrl = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly isDeleting = signal(false);
  readonly showDeleteConfirmation = signal(false);
  readonly deleteError = signal('');

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        tap((id) => {
          this.animalId.set(id);
          this.animal.set(null);
          this.errorMessage.set('');
          this.deleteError.set('');
          this.showDeleteConfirmation.set(false);
          this.photoUrl.set(null);
          this.usedNavigationState = false;
        }),
        switchMap((id) => {
          if (!id) {
            this.isLoading.set(false);
            this.errorMessage.set('Не е посочено валидно ID на животно.');
            return EMPTY;
          }

          return this.reloadAnimal$.pipe(
            startWith(void 0),
            switchMap(() => {
              this.isLoading.set(true);
              this.errorMessage.set('');

              // Използваме подадените данни само при първоначалната навигация.
              const navigationState = history.state as {
                animal?: Animal;
                photoUrl?: string | null;
              };

              const stateAnimal = navigationState.animal;

              if (stateAnimal && stateAnimal.id === id && !this.usedNavigationState) {
                this.usedNavigationState = true;
                this.setAnimalData(
                  stateAnimal,
                  navigationState.photoUrl ?? null,
                );

                // При retryLoad() продължаваме да презареждаме от API.
                return EMPTY;
              }

              return this.animalsService.getById(id).pipe(
                switchMap((animal) => {
                  if (!animal.photoPath) {
                    this.setAnimalData(animal, null);
                    return EMPTY;
                  }

                  return this.animalsService.getPhotoUrl(animal.id).pipe(
                    tap((response) => {
                      this.setAnimalData(animal, response.photoUrl);
                    }),
                    catchError((error: unknown) => {
                      console.error(
                        'Неуспешно зареждане на снимката:',
                        error,
                      );

                      this.setAnimalData(animal, null);
                      return EMPTY;
                    }),
                  );
                }),
                catchError((error: unknown) => {
                  console.error('Неуспешно зареждане на животното:', error);
                  this.errorMessage.set(this.getLoadErrorMessage(error));
                  return EMPTY;
                }),
                finalize(() => {
                  // При навигация с готови данни isLoading вече е false.
                  this.isLoading.set(false);
                }),
              );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retryLoad(): void {
    if (this.animalId()) this.reloadAnimal$.next();
  }

  confirmDelete(): void {
    this.showDeleteConfirmation.set(true);
    this.deleteError.set('');
  }

  cancelDelete(): void {
    this.showDeleteConfirmation.set(false);
    this.deleteError.set('');
  }

  deleteAnimal(): void {
    const animal = this.animal();
    if (!animal || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.deleteError.set('');

    this.animalsService
      .delete(animal.id)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          console.error('Неуспешно изтриване на животното:', error);
          this.deleteError.set(this.getDeleteErrorMessage(error));
        },
      });
  }

  private getLoadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Няма връзка със сървъра. Опитай отново.';
      }
      if (error.status === 401) {
        return 'Сесията ти е изтекла. Моля, влез отново.';
      }
      if (error.status === 404) {
        return 'Животното не е намерено или нямаш достъп до него.';
      }
    }

    return 'Възникна грешка при зареждането на профила.';
  }

  private getDeleteErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Няма връзка със сървъра. Опитай отново.';
      }
      if (error.status === 401) {
        return 'Сесията ти е изтекла. Моля, влез отново.';
      }
      if (error.status === 404) {
        return 'Животното вече не съществува или нямаш достъп до него.';
      }
      if (error.status === 409) {
        return 'Животното не може да бъде изтрито, защото има свързани медицински записи.';
      }
    }

    return 'Възникна грешка при изтриването на животното.';
  }

  editAnimal(): void {
    const animal = this.animal();

    if (!animal) return;

    void this.router.navigate(['/animals', animal.id, 'edit'], {
      state: {
        animal,
        photoUrl: this.photoUrl(),
      },
    });
  }

  private setAnimalData(animal: Animal, photoUrl: string | null): void {
    this.animal.set(animal);
    this.photoUrl.set(photoUrl);
    this.errorMessage.set('');
    this.isLoading.set(false);
  }
}
