import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AttachmentType,
  CovenantRequestDto,
  CovenantRequestsClient,
  MeasurementUnitsClient,
  StorageFile,
} from '@core/api';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { environment } from '@env/environment';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { catchError, concatMap, forkJoin, of, Subscription } from 'rxjs';

type AttachmentDto = FormGroup<{
  uniqueKey: FormControl<string>;
  displayName: FormControl<string>;
  mimeType: FormControl<string>;
  sizeInBytes: FormControl<number>;
}>;

@Component({
  selector: 'app-add-convenant-request-dialog',
  templateUrl: './add-convenant-request-dialog.component.html',
  styleUrl: './add-convenant-request-dialog.component.scss',
})
export class AddConvenantRequestDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _covenantRequestsClient = inject(CovenantRequestsClient);

  filesParam: StorageFile[] = [];

  quantityValueChangesSub: Subscription;
  unitPriceValueChangesSub: Subscription;

  measurementUnits = toSignal(
    this._measurementUnitsClient.getAll(environment.apiVersion),
    { rejectErrors: true, initialValue: [] }
  );

  protected readonly data: {
    translation: any;
    termId: string;
    projectId: string;
    termTitle: string;
  } = inject(MAT_DIALOG_DATA);

  projectVat = 0;

  addConvenantRequestForm = this.fb.group({
    termId: [this.data?.termId],
    projectId: [this.data?.projectId],
    termTitle: [{ value: this.data?.termTitle, disabled: true }],
    businessData: [''],
    measurementUnitId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
    vat: [{ value: 0, disabled: true }],
    singlePrice: [0, [Validators.required, Validators.min(0)]],
    totalPrice: [{ value: 0, disabled: true }],
    attachments: this.fb.array<AttachmentDto>([]),
    isTaxFree: [false],
  });

  async ngOnInit(): Promise<void> {
    this.quantityValueChangesSub = this.quantity.valueChanges.subscribe((quantity) => {
      const totalPrice = quantity > 0 ? this.singlePrice.value * quantity : 0;
      const vatAmount = this.isTaxFree.value ? 0 : totalPrice * (this.vat.value / 100);
      this.totalPrice.setValue(Number((totalPrice + vatAmount).toFixed(2)));
    });

    this.unitPriceValueChangesSub = this.singlePrice.valueChanges.subscribe(
      (singlePrice) => {
        const totalPrice =
          this.quantity.value > 0 ? singlePrice * this.quantity.value : 0;
        const vatAmount = this.isTaxFree.value ? 0 : totalPrice * (this.vat.value / 100);
        this.totalPrice.setValue(Number((totalPrice + vatAmount).toFixed(2)));
      }
    );

    const vatValue = await this._termsDetailsService.getProjectVat(this.data.projectId);
    this.projectVat = vatValue;
    this.vat.setValue(vatValue);
  }

  get termTitle() {
    return this.addConvenantRequestForm.controls.termTitle;
  }

  get businessData() {
    return this.addConvenantRequestForm.controls.businessData;
  }
  get measurementUnitId() {
    return this.addConvenantRequestForm.controls.measurementUnitId;
  }
  get quantity() {
    return this.addConvenantRequestForm.controls.quantity;
  }
  get isTaxFree() {
    return this.addConvenantRequestForm.controls.isTaxFree;
  }
  get vat() {
    return this.addConvenantRequestForm.controls.vat;
  }
  get notes() {
    return this.addConvenantRequestForm.controls.notes;
  }
  get singlePrice() {
    return this.addConvenantRequestForm.controls.singlePrice;
  }
  get totalPrice() {
    return this.addConvenantRequestForm.controls.totalPrice;
  }
  get attachments() {
    return this.addConvenantRequestForm.controls.attachments;
  }

  submit() {
    const requestDto = {
      ...this.addConvenantRequestForm.value,
      totalPrice: this.quantity.value * this.singlePrice.value,
      vat: this.vat.value,
    } as CovenantRequestDto;
    this._covenantRequestsClient
      .create(environment.apiVersion, requestDto)
      .pipe(
        concatMap(() => {
          return forkJoin(
            this.filesParam.length > 0
              ? [
                  this._termsDetailsService.upload(
                    environment.apiVersion,
                    this.filesParam,
                    AttachmentType.ProjectFiles.toString()
                  ),
                ]
              : [of(null)]
          ).pipe(catchError((err) => of(null)));
        }),
        concatMap(() => {
          this.dialogRef.close(true);
          return of();
        })
      )
      .subscribe();
  }

  close() {
    this.dialogRef.close();
  }

  removeFile(fileIdx: number): void {
    this.attachments.removeAt(fileIdx);
  }

  addAttachment(ele: unknown) {
    const files = (ele as HTMLInputElement).files;

    for (let index = 0; index < files.length; index++) {
      const newUniqueKey: string = generateGUID();
      const file: File = files[index];
      this.filesParam.push({
        file: file as any,
        displayName: file.name,
        uniqueKey: newUniqueKey,
      } as StorageFile);
      const newAttachment: AttachmentDto = this.fb.group({
        displayName: file.name,
        uniqueKey: newUniqueKey,
        mimeType: file.type,
        sizeInBytes: file.size,
      });
      this.attachments.push(newAttachment);
    }
  }

  taxFreeChanged(ev: MatCheckboxChange) {
    if (ev.checked) {
      this.vat.setValue(0);
    } else {
      this.vat.setValue(this.projectVat);
    }
  }

  ngOnDestroy(): void {
    if (this.quantityValueChangesSub) {
      this.quantityValueChangesSub.unsubscribe();
    }
    if (this.unitPriceValueChangesSub) {
      this.unitPriceValueChangesSub.unsubscribe();
    }
  }
}
