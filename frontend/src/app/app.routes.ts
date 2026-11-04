import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authenticatedGuard, ownerGuard, pendingApprovalGuard, vetGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Дашборд за собственици
  {
    path: 'dashboard',
    canActivate: [ownerGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'animals/new',
    canActivate: [ownerGuard],
    loadComponent: () => import('./features/animals/animal-form/animal-form.component').then((m) => m.AnimalFormComponent),
  },
  {
    path: 'animals/:id/edit',
    canActivate: [ownerGuard],
    loadComponent: () => import('./features/animals/animal-edit/animal-edit.component').then((m) => m.AnimalEditComponent),
  },
  {
    path: 'animals/:id',
    canActivate: [ownerGuard],
    loadComponent: () => import('./features/animals/animal-details/animal-details.component').then((m) => m.AnimalDetailsComponent),
  },
  {
    path: 'animals/:animalId/medical-records',
    canActivate: [authenticatedGuard],
    loadComponent: () => import('./features/medical-records/medical-records/medical-records.component').then((m) => m.MedicalRecordsComponent),
  },
  {
    path: 'reminders',
    canActivate: [ownerGuard],
    loadComponent: () => import('./features/reminders/reminders/reminders.component').then((m) => m.RemindersComponent),
  },

  // Ветеринарна зона — компонентите ще добавим в следващите стъпки
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

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
