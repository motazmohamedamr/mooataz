import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { generateGUID } from '@core/shared/utils/generate-guid';

type AttachmentDto = FormGroup<{
  uniqueKey: FormControl<string>;
  displayName: FormControl<string>;
  mimeType: FormControl<string>;
  sizeInBytes: FormControl<number>;
  file: FormControl<File>;
}>;

@Component({
  selector: 'app-confirm-accept-reject-dialog',
  templateUrl: './confirm-accept-reject-dialog.component.html',
  styleUrl: './confirm-accept-reject-dialog.component.scss',
})
export class ConfirmAcceptRejectDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly _dialogRef = inject(MatDialogRef);

  confirmRequestForm = this.fb.group({
    notes: [''],
    attachments: this.fb.array<AttachmentDto>([]),
  });

  protected readonly data: {
    translation: any;
    title: string;
    subtitle: string;
    yesBtnText: string;
    noBtnText: string;
    status: 'accept' | 'reject';
    notesAvailable: boolean;
    notesNotRequired: boolean;
  } = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    if (!this.data.notesNotRequired && this.data.notesAvailable) {
      this.notes.addValidators(Validators.required);
    }
  }

  get notes() {
    return this.confirmRequestForm.controls.notes;
  }
  get attachments() {
    return this.confirmRequestForm.controls.attachments as FormArray<AttachmentDto>;
  }

  addAttachment(ele: unknown) {
    const files = (ele as HTMLInputElement).files;
    for (let index = 0; index < files.length; index++) {
      const newUniqueKey: string = generateGUID();
      const file: File = files[index];
      const newAttachment: AttachmentDto = this.fb.group({
        displayName: file.name,
        uniqueKey: newUniqueKey,
        mimeType: file.type,
        sizeInBytes: file.size,
        file,
      });
      this.attachments.push(newAttachment);
    }
  }

  submit() {
    const requestDto = this.confirmRequestForm.value;
    this._dialogRef.close(requestDto);
  }

  close() {
    this._dialogRef.close();
  }

  removeFile(fileIdx: number): void {
    this.attachments.removeAt(fileIdx);
  }
}
