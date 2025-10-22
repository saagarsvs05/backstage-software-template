import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AppFormComponent } from './components/app-form/app-form';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-app', component: AppFormComponent },
  { path: 'edit-app/:id', component: AppFormComponent },
  { path: '**', redirectTo: '/dashboard' }
];
