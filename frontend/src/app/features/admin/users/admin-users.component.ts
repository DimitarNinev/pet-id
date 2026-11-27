import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { AdminUser } from '../../../models/admin.model';
import { AppInputComponent } from '../../../components/app-input/app-input';

type UserRoleFilter = 'ALL' | 'OWNER' | 'VET' | 'ADMIN';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, AppInputComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<AdminUser[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly newUsersThisMonth = signal(0);

  readonly searchTerm = signal('');
  readonly selectedRole = signal<UserRoleFilter>('ALL');

  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();

    return this.users().filter((user) => {
      const matchesRole = role === 'ALL' || user.role === role;

      const fullName =
        `${user.firstName} ${user.lastName}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        user.email.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  });

  readonly totalUsers = computed(() => this.users().length);

  readonly totalOwners = computed(
    () => this.users().filter((user) => user.role === 'OWNER').length,
  );

  readonly totalVets = computed(
    () => this.users().filter((user) => user.role === 'VET').length,
  );

  readonly totalAdmins = computed(
    () => this.users().filter((user) => user.role === 'ADMIN').length,
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      users: this.adminService.getUsers(),
      statistics: this.adminService.getStatistics(),
    }).subscribe({
      next: ({ users, statistics }) => {
        this.users.set(users);
        this.newUsersThisMonth.set(statistics.users.newThisMonth);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users and statistics:', error);
        this.errorMessage.set(
          'Възникна грешка при зареждането на потребителите.',
        );
        this.isLoading.set(false);
      },
    });
  }

  setRoleFilter(role: UserRoleFilter): void {
    this.selectedRole.set(role);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  getRoleLabel(role: AdminUser['role']): string {
    const labels: Record<AdminUser['role'], string> = {
      OWNER: 'Собственик',
      VET: 'Ветеринар',
      ADMIN: 'Администратор',
    };

    return labels[role];
  }

  getVetStatusLabel(user: AdminUser): string {
    return user.vetApproved ? 'Одобрен' : 'Чака одобрение';
  }
}
