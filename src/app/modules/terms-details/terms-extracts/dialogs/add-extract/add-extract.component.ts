import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  AttachmentType,
  ExtractRequestDetailsVm,
  ExtractRequestDto,
  ExtractRequestsClient,
  ExtractRequestType,
  HttpResultOfString,
  StorageFile,
} from '@core/api';
import { environment } from '@env/environment';
import { UploadAttachmentsDialogComponent } from '@modules/terms-details/dialogs/upload-attachments-dialog/upload-attachments-dialog.component';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { AttachmentDto } from '@modules/terms-details/types/attachmentDto';
import { NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { of } from 'rxjs/internal/observable/of';
import { catchError, concatMap } from 'rxjs/operators';

type ExtractTypeList = {
  id: number;
  name: string;
}[];

@Component({
  selector: 'app-add-extract',
  templateUrl: './add-extract.component.html',
  styleUrl: './add-extract.component.scss',
})
export class AddExtractComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly _dialogRef = inject(MatDialogRef);
  private readonly _translateService = inject(TranslateService);
  private readonly _extractRequestsClient = inject(ExtractRequestsClient);
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private destoryRef = inject(DestroyRef);

  filesParam: StorageFile[] = [];

  extractDateMaxDate: NgbDateStruct;
  extractDateMinDate: NgbDateStruct;

  protected readonly data: {
    translation: any;
    termId: string;
    projectId: string;
    supplierId: string;
    contractDataFormValue: any;
    lastExtract: ExtractRequestDetailsVm;
  } = inject(MAT_DIALOG_DATA);

  extractTypesTranslated: Record<string, string> = this._translateService.instant(
    'termsDetails.extracts.extractTypes'
  );

  ExtractRequestTypes: ExtractTypeList = Object.entries(ExtractRequestType)
    .slice(Math.floor(Object.keys(ExtractRequestType).length) / 2)
    .map((st: [string, string | ExtractRequestType]) => {
      return {
        id: +st[1],
        name: this.extractTypesTranslated[st[0]],
      };
    });

  addExtractForm = this.fb.group({
    extractDate: [null, [Validators.required]],
    type: [null, [Validators.required]],
    startDate: [null, [Validators.required]],
    attachments: this.fb.array<AttachmentDto>([]),
  });

  get extractDate() {
    return this.addExtractForm.controls.extractDate;
  }
  get type() {
    return this.addExtractForm.controls.type;
  }
  get startDate() {
    return this.addExtractForm.controls.startDate;
  }
  get attachments() {
    return this.addExtractForm.controls.attachments;
  }

  constructor() {}

  ngOnInit(): void {
    if (this.data?.lastExtract) {
      this.addExtractForm.patchValue({
        startDate: new NgbDate(
          new Date(this.data.lastExtract.startDate).getFullYear(),
          new Date(this.data.lastExtract.startDate).getMonth() + 1,
          new Date(this.data.lastExtract.startDate).getDate()
        ) as any,
        type: this.data.lastExtract.type as any,
      });
      this.extractDateMinDate = this.addOneDay(
        new NgbDate(
          new Date(this.data.lastExtract.extractDate).getFullYear(),
          new Date(this.data.lastExtract.extractDate).getMonth() + 1,
          new Date(this.data.lastExtract.extractDate).getDate()
        )
      );
      this.extractDateMaxDate = null;
      this.startDate.setValue(this.addExtractForm.value.startDate);
      this.startDate.disable();
    } else {
      const currentDate = new Date();
      this.extractDateMinDate = null;
      this.extractDateMaxDate = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
    }
    this.extractDate.valueChanges
      .pipe(takeUntilDestroyed(this.destoryRef))
      .subscribe((value) => {
        if (value) {
          if (!this.data || !this.data.lastExtract) {
            this.startDate.enable();
          }
        } else {
          this.startDate.disable();
        }
        this.cdr.detectChanges();
      });
  }

  submit() {
    const postData = {
      ...this.data.contractDataFormValue,
      ...this.addExtractForm.getRawValue(),
      extractDate: new Date(
        Date.UTC(
          (this.extractDate as FormControl<NgbDate>).getRawValue().year,
          (this.extractDate as FormControl<NgbDate>).getRawValue().month - 1,
          (this.extractDate as FormControl<NgbDate>).getRawValue().day
        )
      ).toISOString(),
      startDate: new Date(
        Date.UTC(
          (this.startDate as FormControl<NgbDate>).getRawValue().year,
          (this.startDate as FormControl<NgbDate>).getRawValue().month - 1,
          (this.startDate as FormControl<NgbDate>).getRawValue().day
        )
      ).toISOString(),
    } as ExtractRequestDto;

    this._extractRequestsClient
      .create(environment.apiVersion, postData)
      .pipe(
        concatMap((result: HttpResultOfString) => {
          return forkJoin(
            this.filesParam.length > 0
              ? [
                  of(result.result), // this is new ID created
                  this._termsDetailsService.upload(
                    environment.apiVersion,
                    this.filesParam,
                    AttachmentType.ProjectFiles.toString()
                  ),
                ]
              : [of(result.result)]
          ).pipe(catchError((err) => of(null)));
        }),
        concatMap((res) => {
          this._dialogRef.close(res[0]);
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

  private addOneDay(ngbDate: NgbDate): NgbDate {
    // Convert NgbDate to JavaScript Date
    const jsDate = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);

    // Add one day
    jsDate.setDate(jsDate.getDate() + 1);

    // Convert back to NgbDate
    return new NgbDate(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate());
  }
}
