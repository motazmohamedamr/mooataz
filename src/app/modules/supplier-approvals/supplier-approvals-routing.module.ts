import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SupplierApprovalsTableComponent } from './supplier-approvals-table/supplier-approvals-table.component';
import { SupplierApprovalsFormComponent } from './supplier-approvals-form/supplier-approvals-form.component';

const routes: Route[] = [
  {
    path: '',
    component: SupplierApprovalsTableComponent,
  },
  {
    path: 'request',
    component: SupplierApprovalsFormComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupplierApprovalsRoutingModule {}
