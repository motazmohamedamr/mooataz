import { AttachmentSubType, FileAttachmentDto } from '@core/api';

export type AttachmentWithTypes = [
  {
    files: FileAttachmentDto[];
    subtype: AttachmentSubType.None;
  },
  {
    files: FileAttachmentDto[];
    subtype: AttachmentSubType.Schemes;
  },
  {
    files: FileAttachmentDto[];
    subtype: AttachmentSubType.QuantitySurveySchedule;
  },
  {
    files: FileAttachmentDto[];
    subtype: AttachmentSubType.ApprovedPriceQuote;
  }
];
