import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AppInputComponent } from "../../../components/app-input/app-input";
import { AppDropdownComponent } from "../../../components/app-dropdown/app-dropdown";
import { AppButtonComponent } from "../../../components/app-button/app-button";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, AppInputComponent, AppDropdownComponent, AppButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: '../auth-page.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  showPassword = false;
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  type = [
    { value: 'OWNER', label: 'Собственик на домашен любимец' },
    { value: 'VET', label: 'Ветеринарен лекар' },
  ];

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    ],
    role: ['OWNER' as 'OWNER' | 'VET', Validators.required],
  });

  roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'user', label: 'Потребител' },
    { value: 'guest', label: 'Гост' }
  ];

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

          if (user.role === 'VET' && !user.vetApproved) {
            void this.router.navigate(['/pending-approval']);
            return;
          }

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
      : Array.isArray(error.error?.message)
        ? error.error.message.join(' ')
        : error.error?.message ||
        'Регистрацията не беше успешна.';
  }
}