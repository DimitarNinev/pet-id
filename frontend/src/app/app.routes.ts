import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AnimalFormComponent } from './features/animals/animal-form/animal-form.component';
import { AnimalDetailsComponent } from './features/animals/animal-details/animal-details.component';
import { AnimalEditComponent } from './features/animals/animal-edit/animal-edit.component';
import { MedicalRecordsComponent } from './features/medical-records/medical-records/medical-records.component';
import { RemindersComponent } from './features/reminders/reminders/reminders.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Дашборд за собственици
  { path: 'dashboard', component: DashboardComponent },
  { path: 'animals/new', component: AnimalFormComponent },
  { path: 'animals/:id/edit', component: AnimalEditComponent },
  { path: 'animals/:id', component: AnimalDetailsComponent },
  { path: 'animals/:animalId/medical-records', component: MedicalRecordsComponent },
  { path: 'reminders', component: RemindersComponent },

  // Ветеринарна зона — компонентите ще добавим в следващите стъпки
  {
    path: 'vet',
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
    loadComponent: () =>
      import('./features/auth/pending-approval/pending-approval.component')
        .then((m) => m.PendingApprovalComponent),
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
