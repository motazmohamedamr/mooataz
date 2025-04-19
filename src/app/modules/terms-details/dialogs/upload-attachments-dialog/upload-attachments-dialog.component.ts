import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AttachmentSubType, StorageFile } from '@core/api';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { AttachmentDto } from '@modules/terms-details/types/attachmentDto';

@Component({
  selector: 'app-upload-attachments-dialog',
  templateUrl: './upload-attachments-dialog.component.html',
  styleUrl: './upload-attachments-dialog.component.scss',
})
export class UploadAttachmentsDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef);
  filesTypesToUpload: { title: string; type: AttachmentSubType; attachments: any[] }[];

  protected readonly data: {
    translation: any;
    filesParam: StorageFile[];
    attachments: FormArray<AttachmentDto>;
    filesTypesToUpload: { title: string; type: AttachmentSubType; attachments: any[] }[];
    title: string;
  } = inject(MAT_DIALOG_DATA);

  filesParam: StorageFile[] = [];
  attachments: FormArray<AttachmentDto> = new FormArray([]);

  ngOnInit(): void {
    this.filesTypesToUpload = this.data?.filesTypesToUpload || [
      {
        title: this.data?.translation.attachmentTypes.Schemes,
        type: AttachmentSubType.Schemes,
        attachments: [],
      },
      {
        title: this.data?.translation.attachmentTypes.QuantitySurveySchedule,
        type: AttachmentSubType.QuantitySurveySchedule,
        attachments: [],
      },
      {
        title: this.data?.translation.attachmentTypes.ApprovedPriceQuote,
        type: AttachmentSubType.ApprovedPriceQuote,
        attachments: [],
      },
    ];

    this.filesParam = this.data?.filesParam || [];
    this.attachments = this.data?.attachments || new FormArray([]);

    for (const attachment of this.attachments.value) {
      this.filesTypesToUpload[attachment.attachmentSubType - 1].attachments.push(
        attachment
      );
    }
  }

  uploadFiless(files: FileList, fileType: AttachmentSubType, idx: number) {
    for (let index = 0; index < files.length; index++) {
      const newUniqueKey: string = generateGUID();
      const file: File = files[index];
      this.filesParam.push({
        file: file as any,
        displayName: file.name,
        uniqueKey: newUniqueKey,
      } as StorageFile);
      const newAttachment: AttachmentDto = new FormGroup({
        displayName: new FormControl(file.name),
        uniqueKey: new FormControl(newUniqueKey),
        mimeType: new FormControl(file.type),
        sizeInBytes: new FormControl(file.size),
        attachmentSubType: new FormControl(fileType),
      });
      this.attachments.push(newAttachment);
      this.filesTypesToUpload[idx].attachments.push(newAttachment.value);
    }
  }

  removeFile(attachment: any) {
    const attachmentIdx = this.attachments.value.findIndex(
      (p) => p.uniqueKey === attachment.uniqueKey
    );
    this.attachments.removeAt(attachmentIdx);
    this.filesParam.splice(this.filesParam.indexOf(attachment.uniqueKey), 1);

    const atts = this.filesTypesToUpload[attachment.attachmentSubType - 1].attachments;
    atts.splice(atts.indexOf(attachment.uniqueKey), 1);
  }

  close() {
    this.dialogRef.close();
  }

  closeWithData() {
    this.dialogRef.close({
      filesParam: this.filesParam,
      attachmentsArray: this.attachments,
    });
  }
}

