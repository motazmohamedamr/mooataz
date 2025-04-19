import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { ContractTypeComponent } from './components/contract-type/contract-type.component';
import { NgModule } from '@angular/core';
import { MockContractTypesComponent } from './components/mock-contract-types/mock-contract-types.component';
import { MeasurementUnitVm } from '@core/api';
import { MeasurementUnitVmComponent } from './components/measurement-unit-vm/measurement-unit-vm.component';
import { ClientComponent } from '@modules/settings/components/client/client.component';
import { CountryComponent } from './components/country/country.component';
import { BranchesComponent } from './components/branches/branches.component';
import { CommerceChambersComponent } from './components/commerce-chambers/commerce-chambers.component';
import { SuppliersComponent } from './components/suppliers/suppliers.component';
import { MaterialsComponent } from './components/materials/materials.component';
import { CityComponent } from './components/city/city.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: 'contract-type',
        component: ContractTypeComponent,
      },
      {
        path: 'measurement-unitVm',
        component: MeasurementUnitVmComponent,
      },
      {
        path: 'materials',
        component: MaterialsComponent,
      },
      {
        path: 'clients',
        component: ClientComponent,
      },
      {
        path: 'mock-contract-types',
        component: MockContractTypesComponent,
      },
      {
        path: 'countries',
        component: CountryComponent,
      },
      {
        path: 'cities',
        component: CityComponent,
      },
      {
        path: 'branches',
        component: BranchesComponent,
      },
      {
        path: 'commerce-chambers',
        component: CommerceChambersComponent,
      },
      {
        path: 'suppliers',
        component: SuppliersComponent,
      },
      { path: '', redirectTo: 'horizontal', pathMatch: 'full' },
      { path: '**', redirectTo: 'horizontal', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
