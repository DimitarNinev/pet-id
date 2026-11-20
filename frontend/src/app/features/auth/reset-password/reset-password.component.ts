
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AppInputComponent } from '../../../components/app-input/app-input';
import { AppButtonComponent } from '../../../components/app-button/app-button';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppInputComponent,
    AppButtonComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: '../auth-page.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  private readonly token =
    this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.token) {
      this.errorMessage.set('Липсва токен за възстановяване. Поискай нов линк.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Паролите не съвпадат.');
      return;
    }

    if (this.loading()) return;

    this.loading.set(true);

    this.auth.resetPassword({
      token: this.token,
      password,
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.form.reset();
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
      : 'Линкът за възстановяване е невалиден или е изтекъл.';
  }
}
