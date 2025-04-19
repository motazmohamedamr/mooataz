import { ProjectsModule } from './../modules/projects/projects.module';
import { Routes } from '@angular/router';
import { Role } from '@core/api';
import { canMatchWithRoles } from '@core/auth/guards/roles.guard';
import { canMatchWithDefaultTenant } from '@core/auth/guards/default-tenant.guard';
import { canAccess } from '@core/auth/guards/canAccess.guard';
import { MODULES } from '@core/models';
import { HomepageComponent } from './homepage/homepage.component';
import { RegistrationComponent } from './registration/registration.component';

const Routing: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomepageComponent,
  },
  {
    path: 'registration',
    pathMatch: 'full',
    component: RegistrationComponent,
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'builder',
    loadChildren: () => import('./builder/builder.module').then((m) => m.BuilderModule),
  },
  {
    path: 'contracts',
    loadChildren: () =>
      import('../modules/contracts/contracts.module').then((m) => m.ContractsModule),
  },
  {
    path: 'terms-details/:termId/:projectId',
    loadChildren: () =>
      import('../modules/terms-details/terms-details.module').then(
        (m) => m.TermsDetailsModule
      ),
  },
  {
    path: 'sharedtest',
    loadChildren: () =>
      import('./sharedtest/sharedtest.module').then((m) => m.SharedtestModule),
  },
  {
    path: 'settings/users',
    canMatch: [canAccess(MODULES.Users)],
    loadChildren: () =>
      import('../modules/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'multi-tenancy',
    canMatch: [canAccess(MODULES.MultiTenancy), canMatchWithDefaultTenant],
    loadChildren: () =>
      import('../modules/multi-tenancy/multi-tenancy.module').then(
        (m) => m.MultiTenancyModule
      ),
  },
  {
    path: 'settings',
    canMatch: [
      canAccess([
        MODULES.Users,
        MODULES.ContractTypes,
        MODULES.MeasuringUnits,
        MODULES.Materials,
        MODULES.Countries,
      ]),
    ],
    loadChildren: () =>
      import('../modules/settings/settings.module').then((m) => m.SettingsModule),
  },
  {
    path: 'account',
    loadChildren: () =>
      import('../modules/account/account.module').then((m) => m.AccountModule),
  },
  {
    path: 'crafted/pages/profile',
    loadChildren: () =>
      import('../modules/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: 'crafted/pages/wizards',
    loadChildren: () =>
      import('../modules/wizards/wizards.module').then((m) => m.WizardsModule),
  },
  {
    path: 'crafted/widgets',
    loadChildren: () =>
      import('../modules/widgets-examples/widgets-examples.module').then(
        (m) => m.WidgetsExamplesModule
      ),
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('../modules/projects/projects.module').then((m) => m.ProjectsModule),
  },
  {
    path: 'supplier-approvals',
    loadChildren: () =>
      import('../modules/supplier-approvals/supplier-approvals.module').then(
        (m) => m.SupplierApprovalsModule
      ),
  },
  {
    path: 'apps/chat',
    loadChildren: () =>
      import('../modules/apps/chat/chat.module').then((m) => m.ChatModule),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];

export { Routing };
