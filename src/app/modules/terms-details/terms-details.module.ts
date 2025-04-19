import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsDetailsComponent } from './terms-details.component';
import { SharedModule } from '@core/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { TermsDetailsRoutingModule } from './terms-details-routing.module';
import { PriceRequestsComponent } from './price-requests/price-requests.component';
import { SupplyRequestsComponent } from './supply-requests/supply-requests.component';
import { TermsExtractsComponent } from './terms-extracts/terms-extracts.component';
import { AddPriceRequestDialogComponent } from './price-requests/add-price-request-dialog/add-price-request-dialog.component';
import { NoPriceRequestsComponent } from './price-requests/no-price-requests/no-price-requests.component';
import { PriceRequestsStatusListComponent } from './price-requests/price-requests-status-list/price-requests-status-list.component';
import { PriceRequestsSampleApprovalComponent } from './price-requests/price-requests-sample-approval/price-requests-sample-approval.component';
import { AddSupplyRequestDialogComponent } from './dialogs/add-supply-request-dialog/add-supply-request-dialog.component';
import { NoSupplyRequestsComponent } from './supply-requests/no-supply-requests/no-supply-requests.component';
import { SupplyRequestsListComponent } from './supply-requests/supply-requests-list/supply-requests-list.component';
import { ConfirmAcceptRejectDialogComponent } from './dialogs/confirm-accept-reject-dialog/confirm-accept-reject-dialog.component';
import { AddSupplerDialogComponent } from './price-requests/add-suppler-dialog/add-suppler-dialog.component';
import { CertifiedsuppliersComponent } from './price-requests/certified-suppliers-list/certified-suppliers-list.component';
import { CertifiedSupplierComponent } from './price-requests/certified-suppliers-list/certified-supplier/certified-supplier.component';
import { SupplyRequestsStatusListComponent } from './supply-requests/supply-requests-status-list/supply-requests-status-list.component';
import { PriceRequestsListComponent } from './price-requests/price-requests-list/price-requests-list.component';
import { AttachmentsDialogComponent } from './dialogs/attachments-dialog/attachments-dialog.component';
import { SupplyRequestsAttachmentsComponent } from './supply-requests/supply-requests-attachments/supply-requests-attachments.component';
import { SupplyTransactionsComponent } from './supply-requests/supply-transactions/supply-transactions.component';
import { ConvenantRequestsComponent } from './convenant-requests/convenant-requests.component';
import { NoConvenantRequestsComponent } from './convenant-requests/no-convenant-requests/no-convenant-requests.component';
import { AddConvenantRequestDialogComponent } from './convenant-requests/add-convenant-request-dialog/add-convenant-request-dialog.component';
import { ConvenantRequestsAttachmentsComponent } from './convenant-requests/convenant-requests-attachments/convenant-requests-attachments.component';
import { ConvenantRequestsListComponent } from './convenant-requests/convenant-requests-list/convenant-requests-list.component';
import { ConvenantRequestsHistoryComponent } from './convenant-requests/convenant-requests-history/convenant-requests-history.component';
import { ConvenantTransactionsComponent } from './convenant-requests/convenant-transactions/convenant-transactions.component';
import { AddTransactionDialogComponent } from './dialogs/add-transaction-dialog/add-transaction-dialog.component';
import { NgUnlessDirective } from './directives/ngUnless.directive';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateCustomParserFormatter } from '@modules/contracts/shared/formatters/date-formatter';
import { UploadAttachmentsDialogComponent } from './dialogs/upload-attachments-dialog/upload-attachments-dialog.component';
import { NoExtractsComponent } from './terms-extracts/components/no-extracts/no-extracts.component';
import { ExtractsListViewComponent } from './terms-extracts/extracts-list-view/extracts-list-view.component';
import { ExtractsDetailsViewComponent } from './terms-extracts/extracts-details-view/extracts-details-view.component';
import { ContractorDataComponent } from './terms-extracts/components/contractor-data/contractor-data.component';
import { ExtractMainDataComponent } from './terms-extracts/components/extract-main-data/extract-main-data.component';
import { ExtractDataComponent } from './terms-extracts/components/extract-data/extract-data.component';
import { ExtractDiscountComponent } from './terms-extracts/components/extract-discount/extract-discount.component';
import { ExtractAttachmentsComponent } from './terms-extracts/components/extract-attachments/extract-attachments.component';
import { ItemExtractsComponent } from './terms-extracts/components/item-extracts/item-extracts.component';
import { ExtractStatusComponent } from './terms-extracts/components/extract-status/extract-status.component';
import { ExtractRequestStatusComponent } from './terms-extracts/components/extract-request-status/extract-request-status.component';
import { ExtractTransactionsComponent } from './terms-extracts/components/extract-transactions/extract-transactions.component';
import { AddContractDataDialogComponent } from './terms-extracts/dialogs/add-contract-data-dialog/add-contract-data-dialog.component';
import { AddExtractComponent } from './terms-extracts/dialogs/add-extract/add-extract.component';
import { DottedBoxComponent } from './terms-extracts/ui/dotted-box/dotted-box.component';
import { ExtractInputComponent } from './terms-extracts/ui/extract-input/extract-input.component';
import { AddDiscountDialogComponent } from './terms-extracts/dialogs/add-discount-dialog/add-discount-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { AttachmentBoxComponent } from './components/attachment-box/attachment-box.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@NgModule({
  declarations: [
    TermsDetailsComponent,
    PriceRequestsComponent,
    CertifiedsuppliersComponent,
    SupplyRequestsComponent,
    TermsExtractsComponent,
    ConvenantRequestsComponent,
    AddPriceRequestDialogComponent,
    NoPriceRequestsComponent,
    PriceRequestsListComponent,
    PriceRequestsStatusListComponent,
    PriceRequestsSampleApprovalComponent,
    AddSupplyRequestDialogComponent,
    NoSupplyRequestsComponent,
    SupplyRequestsListComponent,
    SupplyRequestsStatusListComponent,
    ConfirmAcceptRejectDialogComponent,
    AttachmentsDialogComponent,
    AddSupplerDialogComponent,
    CertifiedSupplierComponent,
    SupplyRequestsAttachmentsComponent,
    SupplyTransactionsComponent,
    NoConvenantRequestsComponent,
    AddConvenantRequestDialogComponent,
    ConvenantRequestsAttachmentsComponent,
    ConvenantRequestsListComponent,
    ConvenantRequestsHistoryComponent,
    ConvenantTransactionsComponent,
    AddTransactionDialogComponent,
    NgUnlessDirective,
    UploadAttachmentsDialogComponent,
    NoExtractsComponent,
    ExtractsListViewComponent,
    ExtractsDetailsViewComponent,
    ContractorDataComponent,
    ExtractMainDataComponent,
    ExtractDataComponent,
    ExtractDiscountComponent,
    ExtractAttachmentsComponent,
    ItemExtractsComponent,
    ExtractStatusComponent,
    ExtractRequestStatusComponent,
    ExtractTransactionsComponent,
    AddContractDataDialogComponent,
    AddExtractComponent,
    DottedBoxComponent,
    ExtractInputComponent,
    AddDiscountDialogComponent,
    AttachmentBoxComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
    TermsDetailsRoutingModule,
    MatExpansionModule,
    NgxExtendedPdfViewerModule,
  ],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter },
  ],
})
export class TermsDetailsModule {}
