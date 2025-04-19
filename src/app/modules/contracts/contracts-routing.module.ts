import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ContractsComponent } from './contracts.component';
import { ContractsTableComponent } from './contracts-table/contracts-table.component';
import { ContractFormComponent } from './contract-form/contract-form.component';
import { STEPPER_ROUTES } from './shared/contract-stepper-routes';
import { ContractMainFormComponent } from './contract-form/contract-main-form/contract-main-form.component';
import { AwardComponent } from './contract-form/award/award.component';
import { ContractDelegationFormComponent } from './contract-form/contract-delegation-form/contract-delegation-form.component';
import { ContractGuaranteeComponent } from './contract-form/contract-guarantee/contract-guarantee.component';
import { ContractDetailFormComponent } from './contract-form/contract-detail-form/contract-detail-form.component';
import { ContractOperationsComponent } from './contract-form/contract-operations/contract-operations.component';
import { ContractOperationQuantitiesComponent } from './contract-form/contract-operation-quantities/contract-operation-quantities.component';
import { ContractFinesComponent } from './contract-form/contract-fines/contract-fines.component';

const contractStepperRoutes: Route[] = [
  {
    path: STEPPER_ROUTES.MAIN,
    outlet: 'contractStepper',
    component: ContractMainFormComponent,
  },
  {
    path: STEPPER_ROUTES.AWARD,
    outlet: 'contractStepper',
    component: AwardComponent,
  },
  {
    path: STEPPER_ROUTES.DELEGATION,
    outlet: 'contractStepper',
    component: ContractDelegationFormComponent,
  },
  {
    path: STEPPER_ROUTES.GUARANTEE,
    outlet: 'contractStepper',
    component: ContractGuaranteeComponent,
  },
  {
    path: STEPPER_ROUTES.DETAILS,
    outlet: 'contractStepper',
    component: ContractDetailFormComponent,
  },
  {
    path: STEPPER_ROUTES.OPERATIONS,
    outlet: 'contractStepper',
    component: ContractOperationsComponent,
  },
  {
    path: STEPPER_ROUTES.QUANTITIES,
    outlet: 'contractStepper',
    component: ContractOperationQuantitiesComponent,
  },
  {
    path: STEPPER_ROUTES.FINES,
    outlet: 'contractStepper',
    component: ContractFinesComponent,
  },
];

const routes: Route[] = [
  {
    path: '',
    component: ContractsComponent,
    children: [
      {
        path: '',
        component: ContractsTableComponent,
      },
      {
        path: 'add',
        component: ContractFormComponent,
        children: contractStepperRoutes,
      },
      {
        path: 'edit/:contractId',
        component: ContractFormComponent,
        children: contractStepperRoutes,
      },
      { path: '**', redirectTo: 'horizontal', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContractsRoutingModule {}
