import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'header-component',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly userRole = this.auth.currentRole;

  navigate() {
    void this.router.navigate(this.userRole() === 'OWNER' ? ['/dashboard'] : ['/vet/dashboard']);
  }
}
