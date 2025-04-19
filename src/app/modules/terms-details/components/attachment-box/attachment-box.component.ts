import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import {
  AttachmentType,
  ExtractRequestDetailsVm,
  ExtractRequestStatusVm,
  FileAttachmentDto,
  Role,
  StorageClient,
  StorageFile,
  StorageFileDto,
} from '@core/api';
import { User } from '@core/auth';
import { TermsDetailsService } from '@modules/terms-details/terms-details.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@env/environment';

@Component({
  selector: 'app-attachment-box',
  templateUrl: './attachment-box.component.html',
  styleUrl: './attachment-box.component.scss',
})
export class AttachmentBoxComponent implements OnInit {
  private readonly _termsDetailsService = inject(TermsDetailsService);
  private readonly _storageClient = inject(StorageClient);
  private readonly _toastr = inject(ToastrService);
  private readonly _translate = inject(TranslateService);

  @Input({ required: true }) attachment: FileAttachmentDto;
  @Input() user: User;
  @Input() extract: ExtractRequestDetailsVm;

  @Output() refreshRequest = new EventEmitter<void>();

  isPdf = false;
  attachmentSrc: string;
  showPdfViewer = false;
  showImageViewer = false;

  ngOnInit() {
    this.isPdf = this.attachment?.extension?.toLowerCase() === 'pdf';

    if (this.attachment.url) {
      this.attachmentSrc = this.attachment.url;
    }
  }

  openViewer(): void {
    this.isPdf ? (this.showPdfViewer = true) : (this.showImageViewer = true);
  }

  closeViewer(): void {
    this.isPdf ? (this.showPdfViewer = false) : (this.showImageViewer = false);
  }

  downloadAttachment(attachment: FileAttachmentDto) {
    this._termsDetailsService.downloadAttachment(attachment);
  }

  deleteAttachment(attachment: FileAttachmentDto) {
    const req = {
      attachmentType: AttachmentType.ProjectFiles,
      files: [
        {
          displayName: attachment.displayName,
          uniqueKey: attachment.uniqueKey,
          file: '',
        } as StorageFile,
      ],
    } as StorageFileDto;
    this._storageClient.deleteStorageFile(environment.apiVersion, req).subscribe(() => {
      this.refreshRequest.emit();
      this._toastr.success(this._translate.instant('termsDetails.fileDeleted'), '', {
        positionClass: 'toast-bottom-center',
      });
    });
  }

  get role(): typeof Role {
    return Role;
  }
  get extractStatus(): typeof ExtractRequestStatusVm {
    return ExtractRequestStatusVm;
  }
}
