import { FormControl, FormGroup } from '@angular/forms';
import { AttachmentSubType } from '@core/api';

export type AttachmentDto = FormGroup<{
  uniqueKey: FormControl<string>;
  displayName: FormControl<string>;
  mimeType: FormControl<string>;
  sizeInBytes: FormControl<number>;
  attachmentSubType: FormControl<AttachmentSubType>;
}>;
