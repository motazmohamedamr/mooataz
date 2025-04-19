import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AttachmentSubType,
  AttachmentType,
  MeasurementUnitsClient,
  PriceApprovalRequestDto,
  PriceRequestsApprovalsClient,
  StorageFile,
} from '@core/api';
import { environment } from '@env/environment';
import { UploadAttachmentsDialogComponent } from '@modules/terms-details/dialogs/upload-attachments-dialog/upload-attachments-dialog.component';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { AttachmentDto } from '@modules/terms-details/types/attachmentDto';
import { TranslateService } from '@ngx-translate/core';
import { catchError, concatMap, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-add-price-request-dialog',
  templateUrl: './add-price-request-dialog.component.html',
  styleUrl: './add-price-request-dialog.component.scss',
})
export class AddPriceRequestDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly _measurementUnitsClient = inject(MeasurementUnitsClient);
  private readonly dialog = inject(MatDialog);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _priceRequestsApprovalsClient = inject(PriceRequestsApprovalsClient);
  private readonly _translateService = inject(TranslateService);
  private readonly _dialogRef = inject(MatDialogRef);

  protected readonly data: {
    translation: any;
    termId: string;
    projectId: string;
    measurementUnitId: string;
  } = inject(MAT_DIALOG_DATA);

  filesParam: StorageFile[] = [];

  addPriceRequestForm = this.fb.group({
    description: ['', [Validators.required]],
    measurementUnitId: [this.data?.measurementUnitId],
    quantity: [0, [Validators.required]],
    notes: [''],
    termId: [this.data?.termId],
    projectId: [this.data?.projectId],
    attachments: this.fb.array<AttachmentDto>([]),
  });

  measurementUnits = toSignal(
    this._measurementUnitsClient.getAll(environment.apiVersion),
    { initialValue: [], rejectErrors: true }
  );

  get description() {
    return this.addPriceRequestForm.controls.description;
  }
  get measurementUnitId() {
    return this.addPriceRequestForm.controls.measurementUnitId;
  }
  get quantity() {
    return this.addPriceRequestForm.controls.quantity;
  }
  get notes() {
    return this.addPriceRequestForm.controls.notes;
  }
  get attachments() {
    return this.addPriceRequestForm.controls.attachments as FormArray<AttachmentDto>;
  }

  submit() {
    const requestDto = this.addPriceRequestForm.value as PriceApprovalRequestDto;
    this._priceRequestsApprovalsClient
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
        title: this.data?.translation.addSampleApprivalForm,
        filesTypesToUpload: [
          {
            title: this.data?.translation.sampleApprivalForm,
            type: AttachmentSubType.None,
            attachments: [],
          },
        ] as { title: string; type: AttachmentSubType; attachments: any[] }[],
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
}
