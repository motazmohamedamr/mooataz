import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractsComponent } from './contracts.component';
import { ContractsTableComponent } from './contracts-table/contracts-table.component';
import { ContractsRoutingModule } from './contracts-routing.module';
import { SharedModule } from '@core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';
import { ContractFormComponent } from './contract-form/contract-form.component';
import { ContractMainFormComponent } from './contract-form/contract-main-form/contract-main-form.component';
import { AwardComponent } from './contract-form/award/award.component';
import { ContractFormInputComponent } from './shared/contract-form-input/contract-form-input.component';
import { ContractDelegationFormComponent } from './contract-form/contract-delegation-form/contract-delegation-form.component';
import { ContractGuaranteeComponent } from './contract-form/contract-guarantee/contract-guarantee.component';
import { ContractDetailFormComponent } from './contract-form/contract-detail-form/contract-detail-form.component';
import { FullDatePipe } from './shared/pipes/full-date.pipe';
import { ContractOperationsComponent } from './contract-form/contract-operations/contract-operations.component';
import { OperationsTableComponent } from './contract-form/contract-operations/operations-table/operations-table.component';
import { OperationsFormComponent } from './contract-form/contract-operations/operations-form/operations-form.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContractOperationQuantitiesComponent } from './contract-form/contract-operation-quantities/contract-operation-quantities.component';
import { ContractQuantityFormComponent } from './contract-form/contract-operation-quantities/contract-quantity-form/contract-quantity-form.component';
import { QuanitiesTableComponent } from './contract-form/contract-operation-quantities/quanities-table/quanities-table.component';
import { ContractFinesComponent } from './contract-form/contract-fines/contract-fines.component';
import { NgbDateCustomParserFormatter } from './shared/formatters/date-formatter';
import { NgbDateParserFormatter, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { ContractFinesTableComponent } from './contract-form/contract-fines/contract-fines-table/contract-fines-table.component';
import { ContractFinesFormComponent } from './contract-form/contract-fines/contract-fines-form/contract-fines-form.component';

@NgModule({
  declarations: [
    ContractsComponent,
    ContractsTableComponent,
    ContractFormComponent,
    ContractMainFormComponent,
    AwardComponent,
    ContractFormInputComponent,
    ContractDelegationFormComponent,
    ContractGuaranteeComponent,
    ContractDetailFormComponent,
    ContractOperationsComponent,
    OperationsTableComponent,
    FullDatePipe,
    OperationsFormComponent,
    ContractOperationQuantitiesComponent,
    ContractQuantityFormComponent,
    QuanitiesTableComponent,
    ContractFinesComponent,
    ContractFinesTableComponent,
    ContractFinesFormComponent,
  ],
  imports: [
    CommonModule,
    ContractsRoutingModule,
    SharedModule,
    TranslateModule,
    RouterOutlet,
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter },
    {
      provide: NgbDatepickerConfig,
      useFactory: () => {
        const config = new NgbDatepickerConfig();
        config.maxDate = { year: 2080, month: 12, day: 31 };
        return config;
      },
    },
  ],
})
export class ContractsModule {}
