import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
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
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppInputComponent, AppButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: '../auth-page.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  showPassword = false;
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly role = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    ],
    role: ['' as 'OWNER' | 'VET', Validators.required],
  });

  constructor() {
    this.setupPhoneValidation();
  }

  selectRole(value: any, label: string): void {
    this.form.controls.role.setValue(value);
    this.role.set(label);
  }

  back() {
    this.form.reset();
    this.role.set('');
  }

  submit(): void {
    if (this.loading()) return;

    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const payload = {
      ...formValue,
      phone: formValue.role === 'VET'
        ? formValue.phone.trim()
        : undefined,
    };

    this.loading.set(true);

    this.auth.register(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user }) => {
          this.loading.set(false);

          void this.router.navigate([
            user.role === 'VET'
              ? (user.vetApproved ? '/vet/dashboard' : '/pending-approval')
              : '/dashboard'
          ]);
        },
        error: (error) => {
          this.loading.set(false);

          this.errorMessage.set(this.getLoginErrorMessage(error));
        },
      });
  }

  getLoginErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'Възникна неочаквана грешка.';
    return error.status === 0
      ? 'Няма връзка със сървъра. Опитай отново.'
      : Array.isArray(error.error?.message)
        ? error.error.message.join(' ')
        : error.error?.message ||
        'Регистрацията не беше успешна.';
  }

  private setupPhoneValidation(): void {
    this.form.controls.role.valueChanges
      .pipe(
        startWith(this.form.controls.role.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((role) => {
        const phoneControl = this.form.controls.phone;

        if (role === 'VET') {
          phoneControl.setValidators([
            Validators.required,
            Validators.pattern(/^(?=(?:\D*\d){7,15}\D*$)\+?[0-9\s()-]+$/),
            Validators.maxLength(30),
          ]);
        } else {
          phoneControl.clearValidators();
        }

        phoneControl.updateValueAndValidity();
      });
  }
}
