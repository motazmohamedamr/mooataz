import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierApprovalsTableComponent } from './supplier-approvals-table/supplier-approvals-table.component';
import { SupplierApprovalsRoutingModule } from './supplier-approvals-routing.module';
import { SharedModule } from '@core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { SupplierApprovalsFormComponent } from './supplier-approvals-form/supplier-approvals-form.component';
import { AddSupplierFormComponent } from './add-supplier-form/add-supplier-form.component';
import { SupplierListComponent } from './supplier-list/supplier-list.component';
import { SupplierListItemComponent } from './supplier-list/supplier-list-item/supplier-list-item.component';
import { RequestRejectionFormDialogComponent } from './request-rejection-form-dialog/request-rejection-form-dialog.component';

@NgModule({
  declarations: [SupplierApprovalsTableComponent, SupplierApprovalsFormComponent, AddSupplierFormComponent, SupplierListComponent, SupplierListItemComponent, RequestRejectionFormDialogComponent],
  imports: [CommonModule, SupplierApprovalsRoutingModule, SharedModule, TranslateModule],
})
export class SupplierApprovalsModule {}

