import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authenticatedGuard, ownerGuard, pendingApprovalGuard, vetGuard } from './core/guards/auth.guards';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component')
        .then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component')
        .then((m) => m.ResetPasswordComponent),
  },

  // Дашборд за собственици
  {
    path: 'dashboard',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then((m) => m.DashboardComponent),
  },
  {
    path: 'animals/new',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/animals/animal-form/animal-form.component')
        .then((m) => m.AnimalFormComponent),
  },
  {
    path: 'animals/:id/edit',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/animals/animal-edit/animal-edit.component')
        .then((m) => m.AnimalEditComponent),
  },
  {
    path: 'animals/:id',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/animals/animal-details/animal-details.component').
        then((m) => m.AnimalDetailsComponent),
  },
  {
    path: 'medical-records/new',
    canActivate: [authenticatedGuard, ownerGuard],
    loadComponent: () =>
      import('./features/medical-records/new-records/new-records.component')
        .then((m) => m.NewRecordsComponent),
  },
  {
    path: 'animals/:animalId/medical-records/new',
    canActivate: [authenticatedGuard, ownerGuard],
    loadComponent: () =>
      import('./features/medical-records/new-records/new-records.component')
        .then((m) => m.NewRecordsComponent),
  },
  {
    path: 'animals/:animalId/medical-records',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/medical-records/medical-records/medical-records.component')
        .then((m) => m.MedicalRecordsComponent),
  },
  {
    path: 'reminders/new',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/reminders/new-reminder/new-reminder.component')
        .then((m) => m.NewReminderComponent),
  },
  {
    path: 'reminders',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/reminders/reminders/reminders.component')
        .then((m) => m.RemindersComponent),
  },
  {
    path: 'clinics',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/clinics/clinics.component')
        .then((m) => m.ClinicsComponent),
  },
  {
    path: 'profile',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/profile/profile.component')
        .then((m) => m.ProfileComponent),
  },

  // Ветеринарна зона
  {
    path: 'vet',
    canActivate: [vetGuard],
    canActivateChild: [vetGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/vet/vet-dashboard/vet-dashboard.component')
            .then((m) => m.VetDashboardComponent),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/vet/vet-search/vet-search.component')
            .then((m) => m.VetSearchComponent),
      },

      {
        path: 'animals/:animalId/examination/new',
        loadComponent: () =>
          import('./features/vet/examination-form/examination-form.component')
            .then((m) => m.ExaminationFormComponent),
      },

      {
        path: 'animals/:animalId/vaccination/new',
        loadComponent: () =>
          import('./features/vet/vaccination-form/vaccination-form.component')
            .then((m) => m.VaccinationFormComponent),
      },

      {
        path: 'animals/:animalId/deworming/new',
        loadComponent: () =>
          import('./features/vet/deworming-form/deworming-form.component')
            .then(m => m.DewormingFormComponent),
      },
    ],
  },

  // Страница за неодобрени ветеринари
  {
    path: 'pending-approval',
    canActivate: [pendingApprovalGuard],
    loadComponent: () =>
      import('./features/auth/pending-approval/pending-approval.component')
        .then((m) => m.PendingApprovalComponent),
  },

  // Админ зона
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
      },
      {
        path: 'vets',
        loadComponent: () =>
          import('./features/admin/vets/admin-vets.component')
            .then(m => m.AdminVetsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component')
            .then(m => m.AdminUsersComponent),
      },
      {
        path: 'animals',
        loadComponent: () =>
          import('./features/admin/animals/admin-animals.component')
            .then(m => m.AdminAnimalsComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
