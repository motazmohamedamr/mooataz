import {
  HttpClient,
  HttpHeaders,
  HttpResponse,
  HttpResponseBase,
} from '@angular/common/http';
import { Component, inject, OnInit, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  AttachmentType,
  FileAttachmentDto,
  FileParameter,
  FileResponse,
  FilesClient,
  IFileDetails,
  StorageClient,
  StorageFile,
  StorageFileDto,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  first,
  mergeMap,
  Observable,
  of,
  switchMap,
  take,
  throwError,
} from 'rxjs';

@Component({
  selector: 'app-project-files',
  templateUrl: './project-files.component.html',
  styleUrl: './project-files.component.scss',
})
export class ProjectFilesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly _filesClient = inject(FilesClient);
  private readonly _storageClient = inject(StorageClient);
  protected readonly translate = inject(TranslateService);
  protected readonly _http = inject(HttpClient);
  protected readonly _toaster = inject(ToastrService);

  projectId: string = '';
  // fileSearchSig = signal(undefined);

  // files$ = toObservable(this.fileSearchSig).pipe(
  //   debounceTime(200),
  //   distinctUntilChanged(),
  //   switchMap((search: string) => {
  //     return this._filesClient.get(this.projectId, environment.apiVersion);
  //   })
  // );
  fileResponseChanged = new BehaviorSubject<void>(undefined);

  fileList: Signal<IFileDetails[]> = toSignal(
    this.fileResponseChanged.pipe(
      switchMap(() =>
        this._filesClient.get(this.route.snapshot.params.id, environment.apiVersion)
      )
    ),
    { initialValue: [], rejectErrors: true }
  );

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params.id;
  }

  handleChange(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    let filesDto: FileParameter[] = [];
    filesDto.push({
      data: file,
      fileName: file.name,
    });
    this._filesClient
      .uploadProjectFile(this.projectId, environment.apiVersion, filesDto)
      .pipe(take(1))
      .subscribe(() => this.fileResponseChanged.next());
  }

  removeProjectFile(file: IFileDetails) {
    const req = {
      attachmentType: AttachmentType.ProjectFiles,
      files: [
        {
          displayName: file.displayFileName,
          uniqueKey: file.fileName,
          file: '',
        } as StorageFile,
      ],
    } as StorageFileDto;
    this._storageClient
      .deleteStorageFile(environment.apiVersion, req)
      .pipe(take(1))
      .subscribe(() => this.fileResponseChanged.next());
  }

  private blobToText(blob: any): Observable<string> {
    return new Observable<string>((observer: any) => {
      if (!blob) {
        observer.next('');
        observer.complete();
      } else {
        let reader = new FileReader();
        reader.onload = (event) => {
          observer.next((event.target as any).result);
          observer.complete();
        };
        reader.readAsText(blob);
      }
    });
  }

  downloadAttachment(uniqueKey: string, displayName: string): void {
    let url_ = environment.apiBaseUrl + '/api/v{apiVersion}/storage/{uniqueKey}/download';
    url_ = url_.replace('{uniqueKey}', encodeURIComponent('' + uniqueKey));
    url_ = url_.replace('{apiVersion}', encodeURIComponent('' + environment.apiVersion));
    url_ = url_.replace(/[?&]$/, '');

    let options_: any = {
      observe: 'response',
      responseType: 'blob',
      headers: new HttpHeaders({
        Accept: 'application/octet-stream',
      }),
    };

    this._http
      .request('get', url_, options_)
      .pipe(first())
      .subscribe((res) => {
        const blob = (res as any).body;
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = displayName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this._toaster.success(
          this.translate.instant('Projects.files.downloadComplete'),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }
}
