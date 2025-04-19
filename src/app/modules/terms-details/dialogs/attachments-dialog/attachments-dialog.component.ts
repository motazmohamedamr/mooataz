import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileAttachmentDto } from '@core/api';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';

@Component({
  selector: 'app-attachments-dialog',
  templateUrl: './attachments-dialog.component.html',
  styleUrl: './attachments-dialog.component.scss',
})
export class AttachmentsDialogComponent {
  private readonly _termsDetailsService = inject(TermsDetailsService);

  protected readonly data: {
    attachments: FileAttachmentDto[];
  } = inject(MAT_DIALOG_DATA);

  downloadAttachment(attachment: FileAttachmentDto) {
    this._termsDetailsService.downloadAttachment(attachment);
  }
}
