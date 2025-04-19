import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AttachmentSubType, FileAttachmentDto } from '@core/api';

import { AttachmentWithTypes } from '@modules/terms-details/types/attachments-with-types';

@Component({
  selector: 'app-price-requests-sample-approval',
  templateUrl: './price-requests-sample-approval.component.html',
  styleUrl: './price-requests-sample-approval.component.scss',
})
export class PriceRequestsSampleApprovalComponent implements OnChanges {
  @Output() refreshRequest = new EventEmitter<void>();

  @Input({ required: true })
  attachments: FileAttachmentDto[] = [];

  @Input() translation: any;

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
    }
  }

  get attachmentSubType(): typeof AttachmentSubType {
    return AttachmentSubType;
  }
}
