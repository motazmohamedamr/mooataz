import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss',
})
export class FileUploaderComponent {
  @Input() multiple: boolean = false;
  @Input() accept: string = 'image/png, image/jpeg, image/gif';
  @Output() uploadFileHandler = new EventEmitter<FileList>();
  @Output() removeFileHandler = new EventEmitter<number>();

  files: UploadedFile[] = [];
  isHovering: boolean = false;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isHovering = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.prepareFilesList(files);
    }
  }

  preFillFileData(files: UploadedFile[]) {
    this.files = files;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isHovering = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isHovering = false;
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.prepareFilesList(files);
    }
  }

  prepareFilesList(files: FileList): void {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.files.push({ file, url: e.target.result, name: file.name });
      };
      reader.readAsDataURL(file);
    });
    if (this.uploadFileHandler.observed) {
      this.uploadFileHandler.emit(files);
      return;
    }
  }

  deleteFile(index: number): void {
    this.files.splice(index, 1);
    if (this.removeFileHandler.observed) {
      this.removeFileHandler.emit(index);
    }
  }

  isImage(file: UploadedFile): boolean {
    return file && file.file && file.file.type.startsWith('image');
  }

  uploadFile(file: UploadedFile): void {
    const formData = new FormData();
    formData.append('file', file.file, file.file.name);

    this.http
      .post('/api/upload', formData, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe(
        (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round((100 * event.loaded) / (event.total || 1));
            console.log(`File upload progress: ${progress}%`);
          } else if (event.type === HttpEventType.Response) {
            this.toastr.success('File uploaded successfully!');
          }
        },
        (error) => {
          this.toastr.error('File upload failed!', '', {
            positionClass: 'toast-bottom-center',
          });
        }
      );
  }

  uploadFiles(): void {
    this.files.forEach((file) => this.uploadFile(file));
  }
}
export interface UploadedFile {
  file: File;
  url: string;
  name: string;
}
