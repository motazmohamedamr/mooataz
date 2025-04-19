import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MeasurementUnitVm } from '@core/api';

@Component({
  selector: 'app-add-discount-dialog',
  templateUrl: './add-discount-dialog.component.html',
  styleUrl: './add-discount-dialog.component.scss',
})
export class AddDiscountDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly _dialogRef = inject(MatDialogRef);

  protected readonly data: {
    translation: any;
    measurementUnits: MeasurementUnitVm[];
  } = inject(MAT_DIALOG_DATA);

  addDiscountForm = this.fb.group({
    description: ['', [Validators.required]],
    measurementUnitId: ['', [Validators.required]],
    totalQuantity: [0, [Validators.required]],
    unitPrice: [0, [Validators.required, Validators.min(1)]],
  });

  get description() {
    return this.addDiscountForm.controls.description;
  }
  get measurementUnitId() {
    return this.addDiscountForm.controls.measurementUnitId;
  }
  get totalQuantity() {
    return this.addDiscountForm.controls.totalQuantity;
  }
  get unitPrice() {
    return this.addDiscountForm.controls.unitPrice;
  }

  close() {
    this._dialogRef.close();
  }

  submit() {
    this._dialogRef.close(this.addDiscountForm.value);
  }
}
