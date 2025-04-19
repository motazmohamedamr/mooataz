import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FileAttachmentDto,
  PriceApprovalRequestPhase,
  PriceApprovalRequestSupplierVm,
  Role,
} from '@core/api';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { TranslateService } from '@ngx-translate/core';
import { PriceSupplierAttachment } from '../certified-suppliers-list.component';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { AddSupplyRequestDialogComponent } from '@modules/terms-details/dialogs/add-supply-request-dialog/add-supply-request-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-certified-supplier',
  templateUrl: './certified-supplier.component.html',
  styleUrl: './certified-supplier.component.scss',
})
export class CertifiedSupplierComponent {
  private readonly _termsDetailsService = inject(TermsDetailsService);

  @Input({ required: true })
  supplier: PriceApprovalRequestSupplierVm;

  @Input() translation: any;
  @Input() userRoles: Role[] = [];
  @Input() enableOpenAddSupplierBtn: boolean;
  @Input() termId: string = '';
  @Input() projectId: string = '';
  @Input() phase: number = 0;

  @Output()
  fileAddedToSupplier = new EventEmitter<{
    supplierAttachment: PriceSupplierAttachment;
    supplierId: string;
  }>();

  @Output()
  deleteFile = new EventEmitter<{ uniqueKey: string; supplierId: string }>();

  @Output()
  toggleSupplier = new EventEmitter<{ checked: boolean; supplierId: string }>();

  @Output()
  deleteSupplier = new EventEmitter<string>();

  protected readonly translate = inject(TranslateService);
  protected readonly _http = inject(HttpClient);
  protected readonly _toastr = inject(ToastrService);
  protected readonly dialog = inject(MatDialog);

  toggleSupplierHandler(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const checked = target.checked;
    this.toggleSupplier.emit({
      supplierId: this.supplier.supplierId,
      checked,
    });
  }

  uploadFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files[0];
    const filenameArr = file.name.split('.');
    this.fileAddedToSupplier.emit({
      supplierAttachment: {
        sizeInBytes: file.size,
        displayName: file.name,
        mimeType: file.type,
        extension: filenameArr[filenameArr.length - 1],
        uniqueKey: generateGUID(),
        file: file,
      },
      supplierId: this.supplier.supplierId,
    });
  }

  removeFile(uniqueKey: string) {
    this.deleteFile.emit({ supplierId: this.supplier.supplierId, uniqueKey });
  }

  removeSupplier() {
    this.deleteSupplier.emit(this.supplier.supplierId);
  }

  downloadAttachment(attachment: FileAttachmentDto): void {
    this._termsDetailsService.downloadAttachment(attachment);
  }

  openAddSupplyDialog(): void {
    const dialog = this.dialog.open(AddSupplyRequestDialogComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.translate.instant('termsDetails.supplyRequests'),
        termId: this.termId,
        projectId: this.projectId,
        supplierId: this.supplier.supplierId,
      },
    });

    dialog.afterClosed().subscribe((data: boolean) => {
      if (data) {
        this._toastr.success(
          this.translate.instant('termsDetails.requestedCreatedSuccessfully'),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      }
    });
  }

  get selectMode(): boolean {
    return (
      (this.userRoles.includes(Role.ProjectsManager) &&
        this.phase === PriceApprovalRequestPhase.SupplierSelection) ||
      (this.userRoles.includes(Role.GeneralManager) &&
        this.phase === PriceApprovalRequestPhase.GeneralManagerReview)
    );
  }

  get role(): typeof Role {
    return Role;
  }
}
