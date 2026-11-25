import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminService } from '../services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  readonly pendingVetCount = this.adminService.pendingVetCount;
  readonly pageTitle = signal('Dashboard');
  readonly pageDescription = signal('Общ преглед на платформата');

  ngOnInit(): void {
    this.updatePageInfo(this.router.url);
    this.adminService.refreshPendingVetCount();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.updatePageInfo(event.urlAfterRedirects);
        }
      });
  }

  private updatePageInfo(url: string): void {
    if (url.includes('/admin/vets')) {
      this.pageTitle.set('Ветеринари');
      this.pageDescription.set(
        'Управление на ветеринарните профили и заявки за одобрение',
      );
      return;
    }

    if (url.includes('/admin/users')) {
      this.pageTitle.set('Потребители');
      this.pageDescription.set(
        'Управление на регистрираните потребители',
      );
      return;
    }

    if (url.includes('/admin/animals')) {
      this.pageTitle.set('Животни');
      this.pageDescription.set(
        'Преглед на регистрираните домашни любимци',
      );
      return;
    }

    this.pageTitle.set('Dashboard');
    this.pageDescription.set('Общ преглед на платформата');
  }

  private loadPendingVetCount(): void {
    this.adminService.getStatistics().subscribe({
      next: (statistics) => {
        this.pendingVetCount.set(statistics.users.pendingVets);
      },
      error: (error) => {
        console.error('Error loading pending vet count:', error);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
