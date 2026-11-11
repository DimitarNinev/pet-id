import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { RemindersService } from '../../../core/services/reminders.service';
import { AnimalsService } from '../../../core/services/animals.service';

import { CreateReminderPayload } from '../../../models/reminder.model';
import { Animal } from '../../../models/animal.model';

import { HeaderComponent } from '../../../components/header/header.component';
import { AppButtonComponent } from '../../../components/app-button/app-button';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { AppCalendarComponent } from '../../../components/app-calendar/app-calendar';
import { AppDropdownComponent } from '../../../components/app-dropdown/app-dropdown';

import { toDateInputValue } from '../../../core/utils/date.utils';
import { Location } from '@angular/common';

interface TimeSlot {
  value: string;
  label: string;
}

@Component({
  selector: 'app-new-reminder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    AppButtonComponent,
    AppInputComponent,
    AppCalendarComponent,
    AppDropdownComponent,
  ],
  templateUrl: './new-reminder.component.html',
  styleUrl: './new-reminder.component.scss',
})

export class NewReminderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly remindersService = inject(RemindersService);
  private readonly animalsService = inject(AnimalsService);

  readonly animals = signal<Animal[]>([]);
  readonly isLoadingAnimals = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');

  readonly today = toDateInputValue(new Date());

  readonly animalOptions = () =>
    this.animals().map((animal) => ({
      value: animal.id,
      label: `${animal.name} · ${animal.petId}`,
    }));

  readonly reminderForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    animalId: ['', Validators.required],
    description: ['', Validators.maxLength(1000)],
    dueDate: [this.today, Validators.required],
    dueTime: ['08:00', Validators.required],
  });

  timeSlots: TimeSlot[] = [];

  constructor(private location: Location) { }

  ngOnInit(): void {
    this.loadAnimals();
    this.timeSlots = this.generateTimeSlots(30);
  }

  loadAnimals(): void {
    this.animalsService
      .getAll()
      .pipe(
        finalize(() => this.isLoadingAnimals.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.animals.set(data),
        error: () => {
          this.errorMessage.set(
            'Не успяхме да заредим животните. Опитай отново.',
          );
        },
      });
  }

  createReminder(): void {
    this.errorMessage.set('');

    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      return;
    }

    const formValue = this.reminderForm.getRawValue();

    const localDate = new Date(
      `${formValue.dueDate}T${formValue.dueTime}:00`,
    );

    if (Number.isNaN(localDate.getTime())) {
      this.errorMessage.set('Моля, въведи валидна дата и час.');
      return;
    }

    const payload: CreateReminderPayload = {
      title: formValue.title.trim(),
      animalId: formValue.animalId,
      description: formValue.description.trim() || undefined,
      dueAt: localDate.toISOString(),
    };

    this.isSaving.set(true);

    this.remindersService
      .create(payload)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/reminders']);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ||
            'Възникна грешка при записването на напомнянето.',
          );
        },
      });
  }

  selectAnimal(animalId: string): void {
    this.reminderForm.controls.animalId.setValue(animalId);
    this.reminderForm.controls.animalId.markAsTouched();
  }

  generateTimeSlots(stepMinutes: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startWith = 480; // 8:00
    const endWith = 1201; // 20:00

    for (let minutes = startWith; minutes < endWith; minutes += stepMinutes) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;

      const formattedHour = String(hour).padStart(2, '0');
      const formattedMin = String(min).padStart(2, '0');
      
      const timeString = `${formattedHour}:${formattedMin}`;

      slots.push({
        value: timeString,
        label: timeString
      });
    }

    return slots;
  }

  cancel(): void {
    this.location.back();
  }
}