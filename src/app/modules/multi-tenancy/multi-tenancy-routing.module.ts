import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MultiTenancyComponent } from './multi-tenancy.component';
import { TenantsTableComponent } from './tenants-table/tenants-table.component';

const routes: Routes = [
  {
    path: '',
    component: MultiTenancyComponent,
    children: [
      {
        path: '',
        component: TenantsTableComponent,
      },
      { path: '**', redirectTo: 'horizontal', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MultiTenancyRoutingModule {}
