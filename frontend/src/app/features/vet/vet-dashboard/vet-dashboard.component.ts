import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vet-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './vet-dashboard.component.html',
  styleUrl: './vet-dashboard.component.scss',
})
export class VetDashboardComponent {
  readonly currentDate = new Date();
  private readonly authService = inject(AuthService);
  userName = signal('Потребител');

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.userName.set(user.firstName + ' ' + user.lastName);
      },
      error: (error) => {
        console.error('Неуспешно зареждане на профила:', error);
      },
    });
  }
}
