import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { AdminAnimal } from '../../../models/admin.model';
import { AppInputComponent } from "../../../components/app-input/app-input";

type AnimalSpeciesFilter = 'ALL' | 'DOG' | 'CAT';

@Component({
  selector: 'app-admin-animals',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AppInputComponent],
  templateUrl: './admin-animals.component.html',
  styleUrl: './admin-animals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnimalsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly animals = signal<AdminAnimal[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly searchTerm = signal('');
  readonly selectedSpecies = signal<AnimalSpeciesFilter>('ALL');

  readonly newAnimalsThisMonth = signal(0);

  readonly filteredAnimals = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const species = this.selectedSpecies();

    return this.animals().filter((animal) => {
      const animalSpecies = animal.species.trim().toLowerCase();

      const matchesSpecies =
        species === 'ALL' ||
        (species === 'DOG' && animalSpecies === 'куче') ||
        (species === 'CAT' && animalSpecies === 'котка');

      const owner = animal.owners[0]?.user;
      const ownerName = owner
        ? `${owner.firstName} ${owner.lastName}`.toLowerCase()
        : '';

      const matchesSearch =
        !search ||
        animal.name.toLowerCase().includes(search) ||
        animal.petId.toLowerCase().includes(search) ||
        (animal.microchipId ?? '').toLowerCase().includes(search) ||
        ownerName.includes(search) ||
        (owner?.email ?? '').toLowerCase().includes(search);

      return matchesSpecies && matchesSearch;
    });
  });


  readonly totalAnimals = computed(() => this.animals().length);

  readonly totalDogs = computed(
    () =>
      this.animals().filter(
        (animal) => animal.species.toLowerCase() === 'куче',
      ).length,
  );

  readonly totalCats = computed(
    () =>
      this.animals().filter(
        (animal) => animal.species.toLowerCase() === 'котка',
      ).length,
  );

  ngOnInit(): void {
    this.loadAnimals();
  }

  loadAnimals(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      animals: this.adminService.getAnimals(),
      statistics: this.adminService.getStatistics(),
    }).subscribe({
      next: ({ animals, statistics }) => {
        this.animals.set(animals);
        this.newAnimalsThisMonth.set(statistics.animals.newThisMonth);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading animals and statistics:', error);
        this.errorMessage.set(
          'Възникна грешка при зареждането на животните.',
        );
        this.isLoading.set(false);
      },
    });
  }

  setSpeciesFilter(species: AnimalSpeciesFilter): void {
    this.selectedSpecies.set(species);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  getSpeciesLabel(species: string): any {
    const normalizedSpecies = species.toUpperCase();

    const labels: Record<string, string> = {
      DOG: 'Куче',
      CAT: 'Котка',
    };

    return labels[normalizedSpecies] ?? species;
  }

  getSexLabel(sex: string | null): string {
    if (!sex) return '—';

    const labels: Record<string, string> = {
      MALE: 'Мъжки',
      FEMALE: 'Женски',
    };

    return labels[sex.toUpperCase()] ?? sex;
  }

  getOwnerName(animal: AdminAnimal): string {
    const owner = animal.owners[0]?.user;

    return owner
      ? `${owner.firstName} ${owner.lastName}`
      : 'Няма собственик';
  }

  getOwnerEmail(animal: AdminAnimal): string {
    return animal.owners[0]?.user.email ?? '—';
  }
}
