import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AttachmentType,
  MeasurementUnitsClient,
  StorageFile,
  SuppliersClient,
  SupplyApprovalRequestDto,
  SupplyRequestsApprovalsClient,
} from '@core/api';
import { environment } from '@env/environment';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, forkJoin, of, Subscription } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { UploadAttachmentsDialogComponent } from '../upload-attachments-dialog/upload-attachments-dialog.component';

type AttachmentDto = FormGroup<{
  uniqueKey: FormControl<string>;
  displayName: FormControl<string>;
  mimeType: FormControl<string>;
  sizeInBytes: FormControl<number>;
}>;

@Component({
  selector: 'app-add-supply-request-dialog',
  templateUrl: './add-supply-request-dialog.component.html',
  styleUrl: './add-supply-request-dialog.component.scss',
})
export class AddSupplyRequestDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly _suppliersClient = inject(SuppliersClient);
  private readonly _dialogRef = inject(MatDialogRef);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _supplyRequestsApprovalsClient = inject(SupplyRequestsApprovalsClient);
  private readonly _translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  quantityValueChangesSub: Subscription;
  unitPriceValueChangesSub: Subscription;
  vatValueChangesSub: Subscription;

  filesParam: StorageFile[] = [];

  suppliersDropdown = toSignal(this.getSuppliers(undefined), {
    rejectErrors: true,
    initialValue: [],
  });
  supplierSig = computed(() => signal(this.suppliersDropdown()));
  supplierList = computed(() => this.supplierSig()());

  measurementUnits = toSignal(
    this._measurementUnitsClient.getAll(environment.apiVersion),
    { rejectErrors: true, initialValue: [] }
  );

  ngOnInit(): void {
    this.quantity.valueChanges.subscribe((quantity) => {
      this.totalUnitPrice.setValue(
        this.unitPrice.value > 0 ? quantity * this.unitPrice.value : 0
      );
    });

    this.unitPrice.valueChanges.subscribe((unitPrice) => {
      this.totalUnitPrice.setValue(
        this.quantity.value > 0 ? unitPrice * this.quantity.value : 0
      );
      const vatAmount = this.totalUnitPrice.value * (this.vat.value / 100);
      this.priceIncludingVat.setValue(this.totalUnitPrice.value + vatAmount);
    });

    this.vat.valueChanges.subscribe((vat) => {
      const vatAmount = this.totalUnitPrice.value * (vat / 100);
      this.priceIncludingVat.setValue(this.totalUnitPrice.value + vatAmount);
    });
  }

  protected readonly data: {
    translation: any;
    termId: string;
    projectId: string;
    supplierId: string;
    termTitle: string;
  } = inject(MAT_DIALOG_DATA);

  addSupplyRequestForm = this.fb.group({
    supplierId: [this.data?.supplierId || ''],
    termTitle: [{ value: this.data?.termTitle, disabled: true }, [Validators.required]],
    description: ['', [Validators.required]],
    measurementUnitId: ['', [Validators.required]],
    quantity: [0, Validators.min(1)],
    notes: [''],
    unitPrice: [0, [Validators.min(1)]],
    totalUnitPrice: [{ value: 0, disabled: true }],
    vat: [0, [Validators.min(1), Validators.max(100)]],
    priceIncludingVat: [{ value: 0, disabled: true }],
    termId: [this.data?.termId],
    projectId: [this.data?.projectId],
    attachments: this.fb.array<AttachmentDto>([]),
  });

  get supplierId() {
    return this.addSupplyRequestForm.controls.supplierId;
  }
  get termTitle() {
    return this.addSupplyRequestForm.controls.termTitle;
  }
  get description() {
    return this.addSupplyRequestForm.controls.description;
  }
  get measurementUnitId() {
    return this.addSupplyRequestForm.controls.measurementUnitId;
  }
  get quantity() {
    return this.addSupplyRequestForm.controls.quantity;
  }
  get notes() {
    return this.addSupplyRequestForm.controls.notes;
  }
  get unitPrice() {
    return this.addSupplyRequestForm.controls.unitPrice;
  }
  get totalUnitPrice() {
    return this.addSupplyRequestForm.controls.totalUnitPrice;
  }
  get vat() {
    return this.addSupplyRequestForm.controls.vat;
  }
  get priceIncludingVat() {
    return this.addSupplyRequestForm.controls.priceIncludingVat;
  }
  get attachments() {
    return this.addSupplyRequestForm.controls.attachments as FormArray<AttachmentDto>;
  }

  submit() {
    const requestDto = this.addSupplyRequestForm.value as SupplyApprovalRequestDto;
    this._supplyRequestsApprovalsClient
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
          this._dialogRef.close(true);
          return of();
        })
      )
      .subscribe();
  }

  close() {
    this._dialogRef.close();
  }

  removeFile(fileIdx: number): void {
    this.attachments.removeAt(fileIdx);
  }

  openFileAttachmentDialog() {
    const dialog = this.dialog.open(UploadAttachmentsDialogComponent, {
      minWidth: '800px',
      maxHeight: '90vh',
      data: {
        translation: this._translateService.instant('termsDetails.attachmentModal'),
        filesParam: this.filesParam,
        attachments: this.attachments,
      },
    });
    dialog
      .afterClosed()
      .subscribe(
        (data: {
          filesParam: StorageFile[];
          attachmentsArray: FormArray<AttachmentDto>;
        }) => {
          this.filesParam = data.filesParam;
          this.attachments.setValue(data.attachmentsArray.value as any);
        }
      );
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

  ngOnDestroy(): void {
    if (this.quantityValueChangesSub) {
      this.quantityValueChangesSub.unsubscribe();
    }
    if (this.vatValueChangesSub) {
      this.vatValueChangesSub.unsubscribe();
    }
    if (this.unitPriceValueChangesSub) {
      this.unitPriceValueChangesSub.unsubscribe();
    }
  }
}
