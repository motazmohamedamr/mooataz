import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { MultiTenancyComponent } from './multi-tenancy.component';
import { TenantsTableComponent } from './tenants-table/tenants-table.component';
import {RouterOutlet} from "@angular/router";
import {TenantsCreateUpdateComponent} from "./tenants-table/tenants-create-update/tenants-create-update.component";
import {MultiTenancyRoutingModule} from "./multi-tenancy-routing.module";

@NgModule({
  declarations: [MultiTenancyComponent, TenantsTableComponent, TenantsCreateUpdateComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    SharedModule,
    TranslateModule,
    RouterOutlet,
    MultiTenancyRoutingModule
  ],
})
export class MultiTenancyModule {}
