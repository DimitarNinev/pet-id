import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RemindersService } from '../../../core/services/reminders.service';
import { Reminder, ReminderType } from '../../../models/reminder.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { AppButtonComponent } from '../../../components/app-button/app-button';

type ReminderFilter = 'ALL' | ReminderType;

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, DatePipe, HeaderComponent, AppButtonComponent],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss',
})
export class RemindersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly remindersService = inject(RemindersService);
  private readonly router = inject(Router);

  readonly reminders = signal<Reminder[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly removingId = signal<string | null>(null);
  readonly successMessage = signal('');

  readonly activeFilter = signal<ReminderFilter>('ALL');

  readonly totalCount = computed(() => this.reminders().length);

  readonly upcomingCount = computed(
    () => this.reminders().filter((item) => item.status === 'UPCOMING').length,
  );

  readonly overdueCount = computed(
    () => this.reminders().filter((item) => item.status === 'OVERDUE').length,
  );

  readonly filteredReminders = computed(() => {
    const filter = this.activeFilter();

    if (filter === 'ALL') {
      return this.reminders();
    }

    return this.reminders().filter((item) => item.type === filter);
  });

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.remindersService.getAll().pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.reminders.set(data);
      },
      error: () => {
        this.errorMessage.set(
          'Възникна грешка при зареждането на напомнянията. Опитай отново.',
        );
      },
    });
  }

  setFilter(filter: ReminderFilter): void {
    this.activeFilter.set(filter);
  }

  getTypeLabel(type: ReminderType): string {
    return type === 'VACCINATION' ? 'Ваксинация' : 'Обезпаразитяване';
  }

  getStatusLabel(status: Reminder['status']): string {
    return status === 'OVERDUE' ? 'Просрочено' : 'Предстоящо';
  }

  getDaysDifference(date: string): number {
    const dueDate = new Date(date);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  getDaysLabel(reminder: Reminder): string {
    const days = this.getDaysDifference(reminder.dueAt);

    if (days < 0) {
      return `Просрочено с ${Math.abs(days)} дни`;
    }

    if (days === 0) {
      return 'Днес';
    }

    if (days === 1) {
      return 'След 1 ден';
    }

    return `След ${days} дни`;
  }

  newReminderForm() {
    this.router.navigate(['/reminders/new']);
  }

  removeReminder(reminder: Reminder): void {
    if (reminder.source !== 'PERSONAL') {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.removingId.set(reminder.id);

    this.remindersService
      .remove(reminder.id)
      .pipe(
        finalize(() => this.removingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.reminders.update(items =>
            items.filter(item => item.id !== reminder.id),
          );

          this.successMessage.set('Напомнянето беше изтрито успешно.');
        },
        error: error => {
          this.errorMessage.set(
            error?.error?.message ||
            'Възникна грешка при изтриването на напомнянето.',
          );
        },
      });
  }
}
