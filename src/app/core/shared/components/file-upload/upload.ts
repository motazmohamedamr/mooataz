import { PhotoStatus } from "../../../enums/photoStatus";
import { PhotoTypeEnum } from "../../../enums/photoTypeEnum";
import { UploadType } from "./upload-type";

export class Upload {
  fileNameWithExtension?: string;
  fileName?: string;
  extension?: string;
  uploadType?: UploadType;
  photoTypeEnum?:PhotoTypeEnum;
  photoStatus?: PhotoStatus
  data?: string | ArrayBuffer;
  url?: string;
  id?: string;
}
