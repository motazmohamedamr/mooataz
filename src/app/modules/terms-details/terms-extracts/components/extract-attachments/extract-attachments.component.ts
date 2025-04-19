import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AttachmentSubType,
  ExtractRequestDetailsVm,
  ExtractRequestStatusVm,
  FileAttachmentDto,
  Role,
} from '@core/api';
import { User } from '@core/auth';
import { AttachmentWithTypes } from '@modules/terms-details/types/attachments-with-types';

@Component({
  selector: 'app-extract-attachments',
  templateUrl: './extract-attachments.component.html',
  styleUrl: './extract-attachments.component.scss',
})
export class ExtractAttachmentsComponent implements OnChanges {
  @Input() translation: any;
  @Input() user: User;
  @Input() extract: ExtractRequestDetailsVm;

  @Output() refreshRequest = new EventEmitter<void>();

  @Input({ required: true })
  attachments: FileAttachmentDto[] = [];

  attachmentsWithTypes: AttachmentWithTypes;

  ngOnChanges(changes: SimpleChanges): void {
    this.attachmentsWithTypes = [
      {
        files: [],
        subtype: AttachmentSubType.None,
      },
      {
        files: [],
        subtype: AttachmentSubType.Schemes,
      },
      {
        files: [],
        subtype: AttachmentSubType.QuantitySurveySchedule,
      },
      {
        files: [],
        subtype: AttachmentSubType.ApprovedPriceQuote,
      },
    ];
    if (changes && changes.attachments && changes.attachments.currentValue) {
      for (const attachment of changes.attachments.currentValue) {
        this.attachmentsWithTypes[attachment.attachmentSubType || 0].files.push(
          attachment
        );
      }
    } else {
      for (const attachment of this.attachments) {
        this.attachmentsWithTypes[attachment.attachmentSubType || 0].files.push(
          attachment
        );
      }
    }
  }

  get attachmentSubType(): typeof AttachmentSubType {
    return AttachmentSubType;
  }
  get role(): typeof Role {
    return Role;
  }
  get extractStatus(): typeof ExtractRequestStatusVm {
    return ExtractRequestStatusVm;
  }
}
