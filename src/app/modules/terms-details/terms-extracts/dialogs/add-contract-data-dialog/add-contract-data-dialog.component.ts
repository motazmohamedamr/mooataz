import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ExtractRequestDetailsVm,
  MeasurementUnitsClient,
  SuppliersClient,
} from '@core/api';
import { environment } from '@env/environment';
import { AddExtractComponent } from '../add-extract/add-extract.component';
import { map } from 'rxjs/internal/operators/map';
import { finalize, first, firstValueFrom, Subscription, tap } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-add-contract-data-dialog',
  templateUrl: './add-contract-data-dialog.component.html',
  styleUrl: './add-contract-data-dialog.component.scss',
})
export class AddContractDataDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly _suppliersClient = inject(SuppliersClient);
  private readonly _dialogRef = inject(MatDialogRef);
  private readonly dialog = inject(MatDialog);

  unitPriceChangeSub: Subscription;
  quantityChangeSub: Subscription;

  measurementUnits = toSignal(
    this._measurementUnitsClient.getAll(environment.apiVersion),
    { rejectErrors: true, initialValue: [] }
  );
  suppliersDropdown = toSignal(this.getSuppliers(undefined), {
    rejectErrors: true,
    initialValue: [],
  });
  supplierSig = computed(() => signal(this.suppliersDropdown()));
  supplierList = computed(() => this.supplierSig()());

  async ngOnInit() {
    if (this.data?.lastExtract) {
      this.contractDataForm.patchValue({
        termId: this.data.termId,
        projectName: this.data.projectName,
        projectId: this.data.projectId,
        description: this.data.lastExtract.description,
        supplierId: this.data.lastExtract.supplierId,
        measurementUnitId: this.data.lastExtract.measurementUnitId,
        contractRefNumber: this.data.lastExtract.contractRefNumber,
        quantity: this.data.lastExtract.quantity,
        unitPrice: this.data.lastExtract.unitPrice,
        notes: this.data.lastExtract.notes,
        itemNumber: this.data.itemNumber,
      });
      this.contractDataForm.disable();
    }
    // const vat = await this._projectsService.getProjectVat(this.data.projectId);
    this.unitPriceChangeSub = this.unitPrice.valueChanges.subscribe(async (unitPrice) => {
      // const vatAmount = +unitPrice * (vat / 100);
      // const totalPrice = +unitPrice + vatAmount;
      this.contractTotalPrice.setValue((unitPrice || 0) * this.quantity.value || 0);
    });
    this.quantityChangeSub = this.quantity.valueChanges.subscribe(async (quantity) => {
      this.contractTotalPrice.setValue((quantity || 0) * this.unitPrice.value || 0);
    });
  }

  protected readonly data: {
    translationAddContractDetailModal: any;
    translationAddExtractModal: any;
    termId: string;
    projectId: string;
    projectName: string;
    itemNumber: string;
    lastExtract: ExtractRequestDetailsVm;
  } = inject(MAT_DIALOG_DATA);

  contractDataForm = this.fb.group({
    termId: [this.data?.termId],
    projectId: [this.data?.projectId],
    projectName: [{ value: this.data?.projectName, disabled: true }],
    description: ['', [Validators.required]],
    supplierId: ['', [Validators.required]],
    measurementUnitId: ['', [Validators.required]],
    contractRefNumber: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
    isTaxFree: [false],
    taxNumber: [{ value: null, disabled: true }],
    bankId: [{ value: '', disabled: true }],
    contactNumber: [{ value: '', disabled: true }],
    BankAccountNumber: [{ value: '', disabled: true }],
    itemNumber: [{ value: this.data?.itemNumber, disabled: true }],
    contractTotalPrice: [{ value: 0, disabled: true }],
  });

  get projectName(): FormControl<string> {
    return this.contractDataForm.controls.projectName;
  }
  get contractRefNumber(): FormControl<string> {
    return this.contractDataForm.controls.contractRefNumber;
  }
  get supplierId(): FormControl<string> {
    return this.contractDataForm.controls.supplierId;
  }
  get taxNumber(): FormControl<string> {
    return this.contractDataForm.controls.taxNumber;
  }
  get bankId(): FormControl<string> {
    return this.contractDataForm.controls.bankId;
  }
  get BankAccountNumber(): FormControl<string> {
    return this.contractDataForm.controls.BankAccountNumber;
  }
  get contactNumber(): FormControl<string> {
    return this.contractDataForm.controls.contactNumber;
  }
  get itemNumber(): FormControl<string> {
    return this.contractDataForm.controls.itemNumber;
  }
  get description(): FormControl<string> {
    return this.contractDataForm.controls.description;
  }
  get measurementUnitId(): FormControl<string> {
    return this.contractDataForm.controls.measurementUnitId;
  }

  get quantity(): FormControl<number> {
    return this.contractDataForm.controls.quantity;
  }
  get unitPrice(): FormControl<number> {
    return this.contractDataForm.controls.unitPrice;
  }
  get contractTotalPrice(): FormControl<number> {
    return this.contractDataForm.controls.contractTotalPrice;
  }
  get notes(): FormControl<string> {
    return this.contractDataForm.controls.notes;
  }
  get isTaxFree(): FormControl<boolean> {
    return this.contractDataForm.controls.isTaxFree;
  }

  taxFreeChanged(ev: MatCheckboxChange) {
    this.isTaxFree.setValue(ev.checked);
  }

  supplierChanged(supplierId: string | number) {
    const supplier = this.suppliersDropdown().find((s) => s.id === supplierId);
    if (!supplier) return;
    this.BankAccountNumber.setValue(supplier.iban);
    this.taxNumber.setValue(supplier.identifierNumber);
    this.bankId.setValue(supplier.bankName);
    this.contactNumber.setValue(supplier.phone1);
  }

  openNextModal() {
    const formValue = this.contractDataForm.getRawValue();
    const dialog = this.dialog.open(AddExtractComponent, {
      minWidth: '600px',
      maxHeight: '90vh',
      data: {
        translation: this.data?.translationAddExtractModal,
        termId: this.data?.termId,
        projectId: this.data?.projectId,
        contractDataFormValue: {
          contractRefNumber: formValue.contractRefNumber,
          quantity: formValue.quantity,
          unitPrice: formValue.unitPrice,
          description: formValue.description,
          supplierId: formValue.supplierId,
          measurementUnitId: formValue.measurementUnitId,
          notes: formValue.notes,
          termId: formValue.termId,
          projectId: formValue.projectId,
          isTaxFree: formValue.isTaxFree,
        },
        lastExtract: this.data?.lastExtract,
      },
    });

    dialog
      .afterClosed()
      .pipe(first())
      .subscribe((newRequestId) => {
        if (newRequestId) {
          this._dialogRef.close(newRequestId);
        }
      });
  }

  close() {
    this._dialogRef.close();
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
      .pipe(
        map((i) => i.items),
        finalize(() => {
          if (this.data?.lastExtract) {
            this.supplierChanged(this.data.lastExtract.supplierId);
          }
        })
      );
  }

  async supplierSearchChanged(search: string) {
    const suppliers = await firstValueFrom(this.getSuppliers(search));
    this.supplierSig().set(suppliers);
  }

  ngOnDestroy(): void {
    if (this.unitPriceChangeSub) {
      this.unitPriceChangeSub.unsubscribe();
    }
    if (this.quantityChangeSub) {
      this.quantityChangeSub.unsubscribe();
    }
  }
}
