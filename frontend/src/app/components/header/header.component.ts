import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'header-component',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);

  readonly userRole = signal('');

  ngOnInit(): void {
    const user = localStorage.getItem('user-role');
    this.userRole.set(user!);
  }

  navigate() {
    this.userRole() == 'OWNER' ? this.router.navigate(['/dashboard']) : this.router.navigate(['/vet/dashboard']);
  }
}