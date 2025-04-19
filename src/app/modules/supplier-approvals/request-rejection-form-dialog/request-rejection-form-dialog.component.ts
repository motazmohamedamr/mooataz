import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ChangeSupplierApprovalRequestStatusDto,
  ISupplierApprovalRequestSupplierVm,
  SupplierApprovalRequestSupplierDto,
  SupplierApprovalsClient,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs';

@Component({
  selector: 'app-request-rejection-form-dialog',
  templateUrl: './request-rejection-form-dialog.component.html',
  styleUrl: './request-rejection-form-dialog.component.scss',
})
export class RequestRejectionFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly _toastr = inject(ToastrService);
  private readonly _supplierApprovalsClient = inject(SupplierApprovalsClient);
  private readonly _translateService = inject(TranslateService);

  protected readonly data: {
    translation: any;
    requestId: string;
    suppliers: ISupplierApprovalRequestSupplierVm[];
  } = inject(MAT_DIALOG_DATA);

  requestRejectForm = this.fb.group({
    notes: ['', [Validators.required]],
  });

  get notes() {
    return this.requestRejectForm.controls.notes;
  }

  submitForm() {
    const request = {
      notes: this.notes.value,
      suppliers: this.data.suppliers.map(
        (supplier: ISupplierApprovalRequestSupplierVm) =>
          ({
            supplierId: supplier.supplierId,
            attachments: supplier.attachments,
            price: supplier.price,
            selected: supplier.selected,
          } as SupplierApprovalRequestSupplierDto)
      ),
    };
    this._supplierApprovalsClient
      .reject(
        this.data.requestId,
        environment.apiVersion,
        request as ChangeSupplierApprovalRequestStatusDto
      )
      .pipe(first())
      .subscribe(() => this.dialogRef.close(true));
  }
}
