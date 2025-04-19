import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html'
})
export class ConfirmationDialogComponent implements OnInit {
  message: string;
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: any // Use private for data
  ) { }

  ngOnInit(): void {
    this.message = this.data.message || 'Default confirmation message';
  }

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
