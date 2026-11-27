import { Component, ElementRef, HostListener, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-vet-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './vet-dashboard.component.html',
  styleUrl: './vet-dashboard.component.scss',
})
export class VetDashboardComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly elRef = inject(ElementRef);
  readonly isOpen = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  readonly currentDate = new Date();
  private readonly authService = inject(AuthService);
  userName = signal('Потребител');

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.userName.set(user.firstName + ' ' + user.lastName);
      },
      error: (error) => {
        console.error('Неуспешно зареждане на профила:', error);
      },
    });
  }

  toggleMenu(): void {
    this.isOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
