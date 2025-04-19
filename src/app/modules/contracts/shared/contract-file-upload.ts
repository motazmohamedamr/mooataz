import { Inject, inject, Injectable, InjectionToken } from '@angular/core';
import {
  AttachmentType,
  FileParameter,
  FilesClient,
  IValueTupleOfStringAndString,
} from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs';
import { ContractFormService } from './contract-form.service';
import { environment } from '@env/environment';
import { Upload } from '@core/shared/components/file-upload/upload';

type FileUploadContract = {
  stepNumber: number;
};

const FileuploadToken = new InjectionToken<FileUploadContract>('contractfileupload', {
  providedIn: 'root',
  factory() {
    return {
      stepNumber: 2,
    };
  },
});

@Injectable()
export class ContractFileUpload {
  protected readonly _filesClient = inject(FilesClient);
  protected readonly _toaster = inject(ToastrService);
  protected readonly _translateService = inject(TranslateService);
  protected readonly _contractFormService = inject(ContractFormService);

  files: IValueTupleOfStringAndString[] = [];
  contractStepNumber: number = 2;

  constructor(@Inject(FileuploadToken) private obj: FileUploadContract) {
    this.contractStepNumber = obj.stepNumber;
  }

  uploadFiless(files: FileList) {
    let filesDto: FileParameter[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      filesDto.push({
        data: file,
        fileName: file.name.split('.').slice(0, -1).join('.'),
      });
    }

    this._filesClient
      .create(
        AttachmentType.ContractFiles,
        this._contractFormService.currentContractId(),
        this.contractStepNumber,
        environment.apiVersion,
        filesDto
      )
      .pipe(first())
      .subscribe((res: IValueTupleOfStringAndString[]) => {
        res.forEach((f) => this.files.push(f));
        const uploadedFileNames = res.map((s) => s.item2).join(', ');
        this._toaster.success(
          `${this._translateService.instant(
            'general.filesUploadedSuccess'
          )} (${uploadedFileNames})`,
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }

  uploadFiles(files: FileList) {
    const formData = new FormData();
    let filesDto: FileParameter[] = [];

    for (let i = 0; i < files.length; i++) {
      const file: File = files[i];
      formData.append('media', file);
      filesDto.push({
        data: file,
        fileName: file.name.split('.').slice(0, -1).join('.'),
      });
    }

    this._filesClient
      .create(
        AttachmentType.ContractFiles,
        this._contractFormService.currentContractId(),
        this.contractStepNumber,
        environment.apiVersion,
        filesDto
      )
      .pipe(first())
      .subscribe((res: IValueTupleOfStringAndString[]) => {
        res.forEach((f) => this.files.push(f));
        const uploadedFileNames = res.map((s) => s.item2).join(', ');
        this._toaster.success(
          `${this._translateService.instant(
            'general.filesUploadedSuccess'
          )} (${uploadedFileNames})`,
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }

  removeFile(index: number) {
    if (index < 0) return;
    this._filesClient
      .delete(
        AttachmentType.ContractFiles,
        this._contractFormService.currentContractId(),
        this.contractStepNumber,
        [this.files[index].item1],
        environment.apiVersion
      )
      .pipe(first())
      .subscribe((res) => {
        this._toaster.success(
          `${this._translateService.instant('general.fileDeleted')}`,
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
        this.files.splice(index, 1);
      });
  }
}
