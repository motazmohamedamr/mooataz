import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings-routing.module';
import { ContractTypeComponent } from './components/contract-type/contract-type.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from './settings.component';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { MockContractTypesComponent } from './components/mock-contract-types/mock-contract-types.component';
import { TranslateModule } from '@ngx-translate/core';
import { ContractTypeFormComponent } from './components/contract-type/contract-type-form/contract-type-form.component';
import { MeasurementUnitVmComponent } from './components/measurement-unit-vm/measurement-unit-vm.component';
import { MeasurementUnitVmFormComponent } from './components/measurement-unit-vm/measurement-unit-vm-form/measurement-unit-vm-form.component';
import { ClientComponent } from '@modules/settings/components/client/client.component';
import { ClientFormComponent } from '@modules/settings/components/client/client-form/client-form.component';
import { DropdownMenusModule } from '@metronic/partials';
import { CountryComponent } from './components/country/country.component';
import { CountryFormComponent } from './components/country/country-form/country-form.component';
import { BranchesComponent } from './components/branches/branches.component';
import { BranchesFormComponent } from './components/branches/branches-form/branches-form.component';
import { CommerceChambersComponent } from './components/commerce-chambers/commerce-chambers.component';
import { CommerceChambersFormComponent } from './components/commerce-chambers/commerce-chambers-form/commerce-chambers-form.component';
import { SuppliersComponent } from './components/suppliers/suppliers.component';
import { SuppliersFormComponent } from './components/suppliers/suppliers-form/suppliers-form.component';
import { SelectWithSearchComponent } from '@core/shared/components/select-with-search/select-with-search.component';
import { MaterialsComponent } from './components/materials/materials.component';
import { MaterialsFormComponent } from './components/materials/materials-form/materials-form.component';
import { CityComponent } from './components/city/city.component';
import { CityFormComponent } from './components/city/city-form/city-form.component';

@NgModule({
  declarations: [
    ContractTypeComponent,
    CountryComponent,
    CountryFormComponent,
    CityComponent,
    CityFormComponent,
    MockContractTypesComponent,
    SettingsComponent,
    ContractTypeFormComponent,
    MeasurementUnitVmComponent,
    MeasurementUnitVmFormComponent,
    MaterialsComponent,
    MaterialsFormComponent,
    ClientComponent,
    ClientFormComponent,
    BranchesComponent,
    BranchesFormComponent,
    CommerceChambersComponent,
    CommerceChambersFormComponent,
    SuppliersComponent,
    SuppliersFormComponent,
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    SharedModule,
    TranslateModule,
    DropdownMenusModule,
  ],
})
export class SettingsModule {}
