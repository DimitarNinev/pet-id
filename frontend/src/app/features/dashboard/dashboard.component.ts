import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AnimalsService } from '../../core/services/animals.service';
import { RemindersService } from '../../core/services/reminders.service';
import { Animal } from '../../models/animal.model';
import { Reminder } from '../../models/reminder.model';
import { AuthService } from '../../core/services/auth.service';

interface DashboardReminder {
  id: string;
  title: string;
  petName: string;
  date: string;
  type: 'vaccine' | 'medicine';
  daysLeft: number;
}

interface DashboardPet extends Animal {
  photoUrl: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})

export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly animalsService = inject(AnimalsService);
  private readonly remindersService = inject(RemindersService);

  userName = signal('Потребител');

  pets = signal<DashboardPet[]>([]);
  readonly isLoadingPets = signal(false);
  readonly petsError = signal('');

  readonly remindersData = signal<Reminder[]>([]);
  readonly isLoadingReminders = signal(false);
  readonly remindersError = signal('');

  readonly reminders = computed<DashboardReminder[]>(() =>
    this.remindersData().slice(0, 4).map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      petName: reminder.animalName,
      date: new Intl.DateTimeFormat('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(reminder.dueAt)),
      type: reminder.type === 'VACCINATION' ? 'vaccine' : 'medicine',
      daysLeft: this.getDaysDifference(reminder.dueAt),
    })),
  );

  get vaccineCount(): number {
    return this.remindersData().filter(
      (reminder) => reminder.type === 'VACCINATION',
    ).length;
  }

  get dewormingCount(): number {
    return this.remindersData().filter(
      (reminder) => reminder.type === 'DEWORMING',
    ).length;
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPets();
    this.loadReminders();
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userName.set(user.firstName);
      },
      error: (error) => {
        console.error('Неуспешно зареждане на профила:', error);
      },
    });
  }

  private loadPets(): void {
    this.isLoadingPets.set(true);
    this.petsError.set('');

    this.animalsService.getAll().subscribe({
      next: (animals) => {
        if (animals.length === 0) {
          this.pets.set([]);
          this.isLoadingPets.set(false);
          return;
        }

        const photoRequests = animals.map((animal) => {
          if (!animal.photoPath) {
            return of({
              ...animal,
              photoUrl: null,
            });
          }

          return this.animalsService.getPhotoUrl(animal.id).pipe(
            map((response) => ({
              ...animal,
              photoUrl: response.photoUrl,
            })),
            catchError(() =>
              of({
                ...animal,
                photoUrl: null,
              }),
            ),
          );
        });

        forkJoin(photoRequests).subscribe({
          next: (pets) => {
            this.pets.set(pets);
            this.isLoadingPets.set(false);
          },
          error: (error) => {
            console.error('Неуспешно зареждане на снимките:', error);
            this.pets.set(
              animals.map((animal) => ({
                ...animal,
                photoUrl: null,
              })),
            );
            this.isLoadingPets.set(false);
          },
        });
      },
      error: (error) => {
        console.error('Неуспешно зареждане на животните:', error);
        this.petsError.set('Животните не могат да бъдат заредени.');
        this.isLoadingPets.set(false);
      },
    });
  }

  private loadReminders(): void {
    this.isLoadingReminders.set(true);
    this.remindersError.set('');

    this.remindersService.getAll().subscribe({
      next: (reminders) => {
        this.remindersData.set(reminders);
        this.isLoadingReminders.set(false);
      },
      error: (error) => {
        console.error('Неуспешно зареждане на напомнянията:', error);
        this.remindersError.set('Напомнянията не могат да бъдат заредени.');
        this.isLoadingReminders.set(false);
      },
    });
  }

  private getDaysDifference(date: string): number {
    const dueDate = new Date(date);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  openAnimalDetails(pet: DashboardPet): void {
    void this.router.navigate(['/animals', pet.id], {
      state: {
        animal: pet,
        photoUrl: pet.photoUrl,
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}