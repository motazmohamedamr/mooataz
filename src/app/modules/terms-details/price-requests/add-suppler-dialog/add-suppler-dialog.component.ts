import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChangePriceApprovalRequestStatusDto, SuppliersClient } from '@core/api';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';

type Attachment = FormGroup<{
  uniqueKey: FormControl<string>;
  displayName: FormControl<string>;
  mimeType: FormControl<string>;
  sizeInBytes: FormControl<number>;
  extension: FormControl<string>;
  file: FormControl<File>;
}>;

type AddSupplierForm = FormGroup<{
  supplierId: FormControl<string>;
  selected: FormControl<boolean>;
  attachments: FormArray<Attachment>;
  supplierName: FormControl<string>;
}>;

@Component({
  selector: 'app-add-suppler-dialog',
  templateUrl: './add-suppler-dialog.component.html',
  styleUrl: './add-suppler-dialog.component.scss',
})
export class AddSupplerDialogComponent {
  private readonly _suppliersClient = inject(SuppliersClient);
  private readonly fb = inject(FormBuilder);
  protected readonly translateService = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AddSupplerDialogComponent>);

  protected readonly data: {
    translation: any;
    existingSupplierIds: string[];
  } = inject(MAT_DIALOG_DATA);

  suppliersDropdown = toSignal(
    this.getSuppliers(undefined).pipe(
      map((suppliers) => {
        const suppliersFiltered = suppliers.filter(
          (supplier) => !(this.data.existingSupplierIds || []).includes(supplier.id)
        );
        return suppliersFiltered;
      })
    ),
    {
      rejectErrors: true,
      initialValue: [],
    }
  );
  supplierSig = computed(() => signal(this.suppliersDropdown()));
  supplierList = computed(() => this.supplierSig()());

  addSupplierForm: AddSupplierForm = this.fb.group({
    supplierId: ['', [Validators.required]],
    selected: [true],
    supplierName: [''],
    attachments: this.fb.array<Attachment>([]),
  });

  get supplierId() {
    return this.addSupplierForm.controls.supplierId as FormControl<string>;
  }
  get supplierName() {
    return this.addSupplierForm.controls.supplierName as FormControl<string>;
  }
  get attachments() {
    return this.addSupplierForm.controls.attachments as FormArray<Attachment>;
  }

  fileUploaded(event: Event) {
    const file: File = (event.target as HTMLInputElement).files[0];
    const filenameArr = file.name.split('.');
    const newAttachment: Attachment = this.fb.group({
      sizeInBytes: file.size,
      displayName: file.name,
      mimeType: file.type,
      extension: filenameArr[filenameArr.length - 1],
      file: file,
      uniqueKey: generateGUID(),
    });
    this.attachments.push(newAttachment);
  }

  addSupplier() {
    this.dialogRef.close(
      this.addSupplierForm.value as ChangePriceApprovalRequestStatusDto & {
        supplierName: string;
      }
    );
  }

  supplierChanged(supplierId: string | number) {
    const supplier = this.suppliersDropdown().find((s) => s.id === supplierId);
    this.supplierName.setValue(supplier.name);
  }

  deleteAttachment(idx: number) {
    this.attachments.removeAt(idx);
  }

  private getSuppliers(search: string | null | undefined) {
    return this._suppliersClient
      .getPage(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        search,
        undefined,
        undefined,
        environment.apiVersion
      )
      .pipe(map((i) => i.items));
  }

  async supplierSearchChanged(search: string) {
    const suppliers = await firstValueFrom(this.getSuppliers(search));
    this.supplierSig().set(suppliers);
  }
}
