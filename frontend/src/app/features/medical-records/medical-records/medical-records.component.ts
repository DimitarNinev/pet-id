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
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';

import { AppButtonComponent } from '../../../components/app-button/app-button';
import { HeaderComponent } from '../../../components/header/header.component';
import {
  MedicalRecord,
  MedicalRecordType,
  MedicalRecordsService,
} from '../../../core/services/medical-records.service';
import { AuthService } from '../../../core/services/auth.service';

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

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [
    DatePipe,
    HeaderComponent,
    AppButtonComponent
  ],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalRecordsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly authService = inject(AuthService);

  readonly animalId = signal('');
  readonly records = signal<MedicalRecord[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly userRole = this.authService.currentRole;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('animalId') ?? ''),
        distinctUntilChanged(),
        tap((animalId) => {
          this.animalId.set(animalId);
          this.records.set([]);
          this.errorMessage.set('');
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

  newRecordsForm() {
    this.router.navigate(['/animals', this.animalId(), 'medical-records', 'new']);
  }
}
