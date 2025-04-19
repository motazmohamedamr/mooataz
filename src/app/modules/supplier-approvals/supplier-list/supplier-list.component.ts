import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { AddSupplierFormComponent } from '../add-supplier-form/add-supplier-form.component';
import { MatDialog } from '@angular/material/dialog';
import {
  FileAttachmentDto,
  ISupplierApprovalRequestSupplierVm,
  SupplierApprovalRequestSupplierDto,
  UploadAttachmentDto,
} from '@core/api';
import { first } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export type SupplierAttachment = {
  sizeInBytes: number;
  displayName: string;
  mimeType: string;
  extension: string;
  uniqueKey: string;
  file: File;
};

@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent {
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly _toastr = inject(ToastrService);

  @Input({ required: true })
  suppliersList: ISupplierApprovalRequestSupplierVm[] = [];

  @Input({ required: true })
  phase: number = 0;

  @Input({ required: true })
  translation: any;

  openSupplierDialog() {
    const addSupplierDialog = this.dialog.open(AddSupplierFormComponent, {
      width: '600px',
      data: {
        translation: this.translation,
      },
    });

    addSupplierDialog
      .afterClosed()
      .pipe(first())
      .subscribe(
        (data: SupplierApprovalRequestSupplierDto & { supplierName: string }) => {
          if (!data) return;

          const foundSupplierIdx = this.suppliersList.findIndex(
            (su) => su.supplierId === data.supplierId
          );
          if (foundSupplierIdx >= 0) {
            this._toastr.error(this.translation.supplierAlreadyAdded, '', {
              positionClass: 'toast-bottom-center',
            });
            return;
          }
          const newSupplier = {
            price: data.price,
            selected: data.selected,
            supplierId: data.supplierId,
            supplierName: data.supplierName,
            attachments:
              !data.attachments || data.attachments.length === 0
                ? []
                : data.attachments.map((attachment) => ({
                    displayName: attachment.displayName,
                    extension:
                      attachment.displayName.split('.')[
                        attachment.displayName.split('.').length - 1
                      ],
                    uniqueName: attachment.displayName,
                    uniqueKey: attachment.uniqueKey,
                    url: '',
                    file: (attachment as UploadAttachmentDto & { file: File }).file,
                  })),
          };
          this.suppliersList.push(newSupplier as any);
          this.cdr.detectChanges();
        }
      );
  }

  fileAddedToSupplier(data: {
    supplierAttachment: SupplierAttachment;
    supplierId: string;
  }) {
    const supplierIdx = this.suppliersList.findIndex(
      (s) => s.supplierId === data.supplierId
    );
    if (supplierIdx < 0) return;

    const supplierAttachments = this.suppliersList[supplierIdx].attachments;
    supplierAttachments.push({
      displayName: data.supplierAttachment.displayName,
      uniqueName: data.supplierAttachment.displayName,
      extension: data.supplierAttachment.extension,
      uniqueKey: data.supplierAttachment.uniqueKey,
      file: data.supplierAttachment.file,
      url: '',
    } as FileAttachmentDto & { file: File });

    this.suppliersList[supplierIdx].attachments = supplierAttachments;
    this.cdr.detectChanges();
  }

  deleteFile(data: { uniqueKey: string; supplierId: string }) {
    const supplierIdx = this.suppliersList.findIndex(
      (s) => s.supplierId === data.supplierId
    );
    if (supplierIdx < 0) return;
    let supplierAttachments: FileAttachmentDto[] =
      this.suppliersList[supplierIdx].attachments;
    supplierAttachments = supplierAttachments.filter(
      (attachment) => attachment.uniqueKey !== data.uniqueKey
    );
    this.suppliersList[supplierIdx].attachments = supplierAttachments;
    this.cdr.detectChanges();
  }

  deleteSupplier(supplierId: string) {
    this.suppliersList = this.suppliersList.filter((s) => s.supplierId !== supplierId);
    this.cdr.detectChanges();
  }

  toggleSupplier(data: { checked: boolean; supplierId: string }) {
    const supplierIdx = this.suppliersList.findIndex(
      (s) => s.supplierId === data.supplierId
    );
    if (supplierIdx < 0) return;
    this.suppliersList[supplierIdx].selected = data.checked;
    this.cdr.detectChanges();
  }
}
