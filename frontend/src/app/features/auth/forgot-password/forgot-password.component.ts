
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { AppButtonComponent } from '../../../components/app-button/app-button';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppInputComponent,
    AppButtonComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../auth-page.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.loading()) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const email = this.form.controls.email.value.trim().toLowerCase();

    this.auth.forgotPassword(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Възникна неочаквана грешка. Опитай отново.';
    }

    if (error.status === 0) {
      return 'Няма връзка със сървъра. Опитай отново.';
    }

    return typeof error.error?.message === 'string'
      ? error.error.message
      : 'Възникна грешка при изпращането на заявката.';
  }
}
