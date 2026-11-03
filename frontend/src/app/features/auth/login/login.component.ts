import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AppInputComponent } from "../../../components/app-input/app-input";
import { AppButtonComponent } from "../../../components/app-button/app-button";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppInputComponent, AppButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: '../auth-page.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  showPassword = false;
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.loading()) return;

    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.auth.login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false))).subscribe({
        next: ({ user }) => {
          this.loading.set(false);

          if (user.role === 'VET') {
            if (!user.vetApproved) {
              void this.router.navigate(['/pending-approval']);
              return;
            }

            void this.router.navigate(['/vet/dashboard']);
            return;
          }

          localStorage.setItem('user-role', user.role);

          void this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading.set(false);

          this.errorMessage.set(this.getLoginErrorMessage(error));
        },
      });
  }

  getLoginErrorMessage(error: any): string {
    return error.status === 0
      ? 'Няма връзка със сървъра. Опитай отново.'
      : typeof error.error?.message === 'string'
        ? error.error.message
        : 'Невалиден имейл или парола.';
  }
}