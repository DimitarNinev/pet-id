import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
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
  type: 'vaccine' | 'medicine' | 'person';
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
  private readonly destroyRef = inject(DestroyRef);
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
      type: reminder.type === 'VACCINATION' ? 'vaccine' : reminder.type === 'DEWORMING' ? 'medicine' : 'person',
      daysLeft: this.getDaysDifference(reminder.dueAt),
    })),
  );

  get reminderCount(): number {
    return this.remindersData().filter(
      (reminder) => reminder.type === 'PERSONAL',
    ).length;
  }

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
    this.authService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => this.userName.set(user.firstName),
      error: (error: unknown) => console.error('Неуспешно зареждане на профила:', error),
    });
  }

  private loadPets(): void {
    this.isLoadingPets.set(true);
    this.petsError.set('');

    this.animalsService.getAll().pipe(
      switchMap((animals) => {
        if (animals.length === 0) return of([] as DashboardPet[]);

        const photoRequests: Observable<DashboardPet>[] = animals.map((animal) => {
          if (!animal.photoPath) return of({ ...animal, photoUrl: null });

          return this.animalsService.getPhotoUrl(animal.id).pipe(
            map((response) => ({ ...animal, photoUrl: response.photoUrl })),
            catchError(() => of({ ...animal, photoUrl: null })),
          );
        });

        return forkJoin(photoRequests);
      }),
      catchError((error: unknown) => {
        console.error('Неуспешно зареждане на животните:', error);
        this.petsError.set('Животните не могат да бъдат заредени.');
        return of([] as DashboardPet[]);
      }),
      finalize(() => this.isLoadingPets.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((pets) => this.pets.set(pets));
  }

  private loadReminders(): void {
    this.isLoadingReminders.set(true);
    this.remindersError.set('');

    this.remindersService.getAll().pipe(
      catchError((error: unknown) => {
        console.error('Неуспешно зареждане на напомнянията:', error);
        this.remindersError.set('Животните не могат да бъдат заредени.');
        return of([] as Reminder[]);
      }),
      finalize(() => this.isLoadingReminders.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((reminders) => this.remindersData.set(reminders));
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
