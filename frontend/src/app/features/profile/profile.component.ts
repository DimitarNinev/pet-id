import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import {
  AuthUser,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../../models/auth.model';

import { AppInputComponent } from '../../components/app-input/app-input';
import { AppButtonComponent } from '../../components/app-button/app-button';
import { HeaderComponent } from '../../components/header/header.component';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    AppInputComponent,
    AppButtonComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly user = signal<AuthUser | null>(null);

  readonly isLoading = signal(true);
  readonly isSubmittingProfile = signal(false);
  readonly isChangingPassword = signal(false);

  readonly profileError = signal('');
  readonly profileSuccess = signal('');

  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');

  readonly isVet = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(30)],
    clinicName: ['', Validators.maxLength(120)],
    clinicAddress: ['', Validators.maxLength(200)],
    city: ['', Validators.maxLength(80)],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.maxLength(72)]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.profileError.set('');

    this.authService
      .getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.isVet.set(user.role === 'VET');

          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? '',
            clinicName: user.clinicName ?? '',
            clinicAddress: user.clinicAddress ?? '',
            city: user.city ?? '',
          });

          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.profileError.set(
            error.status === 401
              ? 'Сесията ти е изтекла. Влез отново.'
              : 'Неуспешно зареждане на профила.',
          );

          this.isLoading.set(false);
        },
      });
  }

  onProfileSubmit(): void {
    if (this.profileForm.invalid || this.isSubmittingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();

    const data: UpdateProfileRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim() || null,
    };

    if (this.isVet()) {
      data.clinicName = value.clinicName.trim() || null;
      data.clinicAddress = value.clinicAddress.trim() || null;
      data.city = value.city.trim() || null;
    }

    this.isSubmittingProfile.set(true);
    this.profileError.set('');
    this.profileSuccess.set('');

    this.authService
      .updateProfile(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser) => {
          this.user.set(updatedUser);
          this.isSubmittingProfile.set(false);
          this.profileSuccess.set('Профилът е актуализиран успешно.');
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmittingProfile.set(false);

          this.profileError.set(
            error.status === 409
              ? 'Този имейл вече е използван от друг профил.'
              : error.status === 401
                ? 'Сесията ти е изтекла. Влез отново.'
                : typeof error.error?.message === 'string'
                  ? error.error.message
                  : 'Неуспешно запазване на промените.',
          );
        },
      });
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isChangingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();

    const data: ChangePasswordRequest = {
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    };

    this.isChangingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    this.authService
      .changePassword(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.passwordForm.reset();
          this.passwordSuccess.set(
            'Паролата е сменена успешно.',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.isChangingPassword.set(false);

          this.passwordError.set(
            error.status === 401
              ? 'Текущата парола е неправилна или сесията е изтекла.'
              : typeof error.error?.message === 'string'
                ? error.error.message
                : 'Неуспешна смяна на паролата.',
          );
        },
      });
  }

  get passwordMismatch(): boolean {
    return (
      this.passwordForm.hasError('passwordMismatch') &&
      this.passwordForm.controls.confirmPassword.touched
    );
  }
}
