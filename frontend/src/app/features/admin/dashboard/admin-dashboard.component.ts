import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminService } from '../services/admin.service';
import { AdminStatistics } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly statistics = signal<AdminStatistics | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getStatistics().subscribe({
      next: (data) => {
        this.statistics.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading admin statistics:', error);
        this.errorMessage.set(
          'Възникна грешка при зареждането на статистиката.',
        );
        this.isLoading.set(false);
      },
    });
  }
}
