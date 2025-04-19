import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { noUserCanMatch, userCanMatch } from '@core/auth';
import { RegistrationComponent } from './pages/registration/registration.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [noUserCanMatch],
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'error',
    loadChildren: () =>
      import('./modules/errors/errors.module').then((m) => m.ErrorsModule),
  },
  {
    path: 'registration',
    component: RegistrationComponent,
  },
  {
    path: '',
    canMatch: [userCanMatch],
    loadChildren: () =>
      import('./_metronic/layout/layout.module').then((m) => m.LayoutModule),
  },
  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
