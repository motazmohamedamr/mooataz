import {
  HttpClient,
  HttpHeaders,
  HttpResponse,
  HttpResponseBase,
} from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  AttachmentType,
  FileAttachmentDto,
  FileResponse,
  ProjectQuantityVm,
  ProjectsClient,
  StorageClient,
  StorageFile,
} from '@core/api';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import {
  catchError,
  first,
  firstValueFrom,
  mergeMap,
  Observable,
  of,
  throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TermsDetailsService {
  protected readonly translate = inject(TranslateService);
  protected readonly _storage = inject(StorageClient);
  protected readonly _http = inject(HttpClient);
  protected readonly _toastr = inject(ToastrService);
  protected readonly _projectClient = inject(ProjectsClient);

  termDetails: WritableSignal<ProjectQuantityVm> = signal(undefined);

  uploadFiles(
    attachments: {
      uniqueKey: string;
      displayName: string;
      mimeType: string;
      sizeInBytes: number;
    }[]
  ): Observable<FileResponse>[] {
    const uploadFileObs: Observable<FileResponse>[] = [];

    const files: StorageFile[] = [];

    attachments.forEach((attachment) => {
      files.push({
        file: (attachment as any & { file: any }).file,
        displayName: attachment.displayName,
        uniqueKey: attachment.uniqueKey,
      } as StorageFile);
    });
    uploadFileObs.push(
      this.upload(environment.apiVersion, files, AttachmentType.ProjectFiles.toString())
    );

    return uploadFileObs;
  }

  upload(
    apiVersion: string,
    files: StorageFile[] | null | undefined,
    attachmentType: string | null | undefined
  ): Observable<FileResponse> {
    let url_ = environment.apiBaseUrl + '/api/v{apiVersion}/storage/upload';
    if (apiVersion === undefined || apiVersion === null)
      throw new Error("The parameter 'apiVersion' must be defined.");
    url_ = url_.replace('{apiVersion}', encodeURIComponent('' + apiVersion));
    url_ = url_.replace(/[?&]$/, '');

    const content_ = new FormData();
    files.forEach((item_, index) => {
      content_.append(`Files[${index}].UniqueKey`, item_.uniqueKey);
      content_.append(`Files[${index}].DisplayName`, item_.displayName);
      content_.append(`Files[${index}].File`, item_.file);
    });

    if (attachmentType !== null && attachmentType !== undefined)
      content_.append('AttachmentType', attachmentType.toString());

    let options_: any = {
      body: content_,
      observe: 'response',
      responseType: 'blob',
      headers: new HttpHeaders({
        Accept: 'application/octet-stream',
      }),
    };

    return this._http
      .request('post', url_, options_)
      .pipe(
        mergeMap((response_: any) => {
          return this.processUpload(response_);
        })
      )
      .pipe(
        catchError((response_: any) => {
          if (response_ instanceof HttpResponseBase) {
            try {
              return this.processUpload(response_ as any);
            } catch (e) {
              return throwError(e) as any as Observable<FileResponse>;
            }
          } else return throwError(response_) as any as Observable<FileResponse>;
        })
      );
  }

  private processUpload(response: HttpResponseBase): Observable<FileResponse> {
    const status = response.status;
    const responseBlob =
      response instanceof HttpResponse
        ? response.body
        : (response as any).error instanceof Blob
        ? (response as any).error
        : undefined;

    let _headers: any = {};
    if (response.headers) {
      for (let key of response.headers.keys()) {
        _headers[key] = response.headers.get(key);
      }
    }
    if (status === 200 || status === 206) {
      const contentDisposition = response.headers
        ? response.headers.get('content-disposition')
        : undefined;
      let fileNameMatch = contentDisposition
        ? /filename\*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/g.exec(
            contentDisposition
          )
        : undefined;
      let fileName =
        fileNameMatch && fileNameMatch.length > 1
          ? fileNameMatch[3] || fileNameMatch[2]
          : undefined;
      if (fileName) {
        fileName = decodeURIComponent(fileName);
      } else {
        fileNameMatch = contentDisposition
          ? /filename="?([^"]*?)"?(;|$)/g.exec(contentDisposition)
          : undefined;
        fileName =
          fileNameMatch && fileNameMatch.length > 1 ? fileNameMatch[1] : undefined;
      }
      return of({
        fileName: fileName,
        data: responseBlob as any,
        status: status,
        headers: _headers,
      });
    } else if (status !== 200 && status !== 204) {
      return this.blobToText(responseBlob).pipe(
        mergeMap((_responseText: string) => {
          return throwError('An unexpected server error occurred.');
        })
      );
    }
    return of(null as any);
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

  downloadAttachment(attachment: FileAttachmentDto): void {
    let url_ = environment.apiBaseUrl + '/api/v{apiVersion}/storage/{uniqueKey}/download';
    url_ = url_.replace('{uniqueKey}', encodeURIComponent('' + attachment.uniqueKey));
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
        a.download = attachment.displayName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this._toastr.success(
          this.translate.instant('Projects.files.downloadComplete'),
          '',
          {
            positionClass: 'toast-bottom-center',
          }
        );
      });
  }

  async getProjectVat(projectId: string): Promise<number> {
    const projectVat = await firstValueFrom(
      this._projectClient.getProjectVAT(projectId, environment.apiVersion)
    );
    return projectVat.vat;
  }
}
