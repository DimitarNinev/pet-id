import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AppInputComponent } from "../../../components/app-input/app-input";
import { AppButtonComponent } from "../../../components/app-button/app-button";
import { HeaderComponent } from "../../../components/header/header.component";
import { Router } from '@angular/router';
import { AnimalsService } from '../../../core/services/animals.service';

interface AnimalSearchResult {
  id: string;
  petId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  photoPath?: string | null;
  dateOfBirth: string | null;
  microchipId: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-vet-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputComponent,
    AppButtonComponent,
    HeaderComponent,
  ],
  templateUrl: './vet-search.component.html',
  styleUrl: './vet-search.component.scss',
})
export class VetSearchComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly animalsService = inject(AnimalsService);

  private readonly apiUrl = 'http://localhost:3000/api/v1/animals';

  readonly searchForm = this.fb.group({
    searchQuery: [
      this.router.getCurrentNavigation()?.extras.state?.['searchQuery'] ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
  });

  animal = signal<AnimalSearchResult | null>(
    history.state?.animal ?? null
  );
  readonly photoUrl = signal<string | null>(null);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  get searchQuery(): string {
    return this.searchForm.controls.searchQuery.value ?? '';
  }

  private successMessageTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadAnimalPhoto(this.animal());
  }

  searchAnimal(): void {
    if (this.isLoading()) {
      return;
    }

    const query = this.searchQuery.trim();

    this.animal.set(null);
    this.photoUrl.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
    if (this.successMessageTimeout) {
      clearTimeout(this.successMessageTimeout);
    }

    if (!query) {
      this.searchForm.controls.searchQuery.markAsTouched();
      this.errorMessage.set('Въведи Pet ID или номер на микрочип.');
      return;
    }

    const token = localStorage.getItem('pet-id-access-token');

    if (!token) {
      this.errorMessage.set('Сесията ти е изтекла. Моля, влез отново.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.isLoading.set(true);

    this.http
      .get<AnimalSearchResult>(`${this.apiUrl}/search`, {
        headers,
        params: { q: query },
      })
      .subscribe({
        next: (animal) => {
          this.animal.set(animal);
          this.loadAnimalPhoto(animal);
          this.successMessage.set('Животното е намерено успешно.');
          this.isLoading.set(false);

          if (this.successMessageTimeout) {
            clearTimeout(this.successMessageTimeout);
          }

          this.successMessageTimeout = setTimeout(() => {
            this.successMessage.set('');
          }, 3000);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.errorMessage.set('Не е намерено животно с този Pet ID или микрочип.');
          } else if (error.status === 403) {
            this.errorMessage.set('Достъпът е разрешен само за одобрени ветеринарни лекари.');
          } else if (error.status === 401) {
            this.errorMessage.set('Нямаш активна сесия. Моля, влез отново.');
          } else {
            this.errorMessage.set('Възникна грешка при търсенето. Опитай отново.');
          }

          this.isLoading.set(false);
        },
      });
  }

  openMedicalHistory(): void {
    const patient = this.animal();

    if (!patient) {
      return;
    }

    this.router.navigate(
      ['/animals', patient.id, 'medical-records'],
      {
        state: {
          animal: patient,
          searchQuery: this.searchQuery,
        },
      }
    );
  }

  openExaminationForm(): void {
    const patient = this.animal();

    if (!patient) {
      return;
    }

    this.router.navigate(
      ['/vet/animals', patient.id, 'examination', 'new'],
      {
        state: { animal: patient },
      },
    );
  }

  openVaccinationForm(): void {
    const patient = this.animal();

    if (!patient) return;

    this.router.navigate(
      ['/vet/animals', patient.id, 'vaccination', 'new'],
      { state: { animal: patient } },
    );
  }

  openDewormingForm(): void {
    const patient = this.animal();

    if (!patient) return;

    this.router.navigate(
      ['/vet/animals', patient.id, 'deworming', 'new'],
      { state: { animal: patient } }
    );
  }

  private loadAnimalPhoto(animal: AnimalSearchResult | null): void {
    this.photoUrl.set(null);

    if (!animal?.photoPath) {
      return;
    }

    this.animalsService.getVetPhotoUrl(animal.id).subscribe({
      next: (response) => {
        this.photoUrl.set(response.photoUrl);
      },
      error: (error) => {
        console.error('Неуспешно зареждане на снимката:', error);
        this.photoUrl.set(null);
      },
    });
  }
}
