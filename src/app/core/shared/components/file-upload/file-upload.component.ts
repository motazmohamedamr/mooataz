import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { catchError, last, map, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Upload } from './upload';
import { PhotoTypeEnum } from 'src/app/core/enums/photoTypeEnum';
import { TranslateService } from '@ngx-translate/core';

export interface FileUploaded {
  file: File;
  url: string;
  name: string;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnInit {
  isHovering = false;

  @Input() multiple = true;
  @Input() text = 'Upload';
  @Input() param = 'file';
  @Input() target = '';
  @Input() maxSize = 4194304;
  @Input() accept = '.png, .jpg, .jpeg, .gif';
  @Input() photoTypeEnum: PhotoTypeEnum;
  @Input() customUploadContentRef: TemplateRef<any>;
  @Input() returningFiles: Array<Upload> = [];
  @Input() ngStyleContainer: any = {};
  @Input() addDefaultCurrentFiles: boolean = true;
  currentFiles: Array<FileUploaded> = [];

  @Output() LoadFileHandler = new EventEmitter<FileList>();
  @Output() DeleteFileHandler = new EventEmitter<any>();

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private _toaster: ToastrService,
    private _translate: TranslateService
  ) {}

  ngOnInit() {}

  async onFileDropped(files: FileList) {
    if (
      (!this.multiple && this.currentFiles.length >= 1) ||
      (!this.multiple && this.returningFiles.length >= 1)
    ) {
      this.toastr.info('Only one file can be uploaded', '', {
        positionClass: 'toast-bottom-center',
      });
      return;
    }

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const url = await this.toBase64(file);
      const curUploadedFile = { file, name: file.name, url };
      if (this.addDefaultCurrentFiles) {
        this.currentFiles.push(curUploadedFile);
      }
      this.uploadFile(file);
    }
    this.LoadFileHandler.emit(files);
  }

  get maxSizeText(): string {
    if (!+this.maxSize) return '0 Bytes';

    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = Math.floor(Math.log(this.maxSize) / Math.log(k));

    return `${parseFloat((this.maxSize / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }

  async fileBrowseHandler(files: FileList) {
    if (
      (!this.multiple && this.returningFiles.length >= 1) ||
      (!this.multiple && this.currentFiles.length >= 1)
    ) {
      this.toastr.info('Only one file can be uploaded');
      return;
    }

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const url = await this.toBase64(file);
      const curUploadedFile = { file, name: file.name, url };
      if (this.addDefaultCurrentFiles) {
        this.currentFiles.push(curUploadedFile);
      }
      this.uploadFile(file);
    }
    this.LoadFileHandler.emit(files);
  }

  deleteFile(index: number) {
    this.DeleteFileHandler.emit(index);
    this.currentFiles.splice(index, 1);
  }

  preFillFileData(files: FileUploaded[]) {
    this.currentFiles = files;
  }

  private uploadFile(file: File) {
    const allowedTypes = this.accept.split(',').filter(Boolean);
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      this.toastr.info(
        'Image extension with name ' + file.name + ' is not supported',
        '',
        {
          positionClass: 'toast-bottom-center',
        }
      );
      return false;
    }

    if (file.size > this.maxSize) {
      this.toastr.info('Maximum size allowed is ' + this.maxSize / 1024 + 'Mb', '', {
        positionClass: 'toast-bottom-center',
      });
      return false;
    }

    if (!this.LoadFileHandler.observed) {
      const formData = new FormData();
      formData.append(this.param, file);

      this.http
        .post<any>(this.target, formData)
        .pipe(
          map((event) => {
            switch (event.type) {
              case HttpEventType.UploadProgress:
                const progress = Math.round((100 * event.loaded) / event.total);
                return { ...file, progress };
              case HttpEventType.Response:
                return event.body;
              default:
                return `Unhandled event: ${event.type}`;
            }
          }),
          tap((message) => {
            if (typeof message === 'object' && message !== null) {
              // this.uploadedFiles.push(message);
            }
          }),
          last(),
          catchError((error: HttpErrorResponse) => {
            this.toastr.error('Upload failed: ' + error.message, '', {
              positionClass: 'toast-bottom-center',
            });
            return [];
          })
        )
        .subscribe();
    }
  }

  downloadFile(uploadedFile: FileUploaded) {
    const a = document.createElement('a');
    a.href = uploadedFile.url;
    a.download = uploadedFile.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this._toaster.success(this._translate.instant('general.downloadComplete'), '', {
      positionClass: 'toast-bottom-center',
    });
  }
}
