import {
  HttpClient,
  HttpHeaders,
  HttpResponse,
  HttpResponseBase,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AccountListVm,
  AccountsClient,
  BusinessType,
  FileResponse,
  ProjectAssignees,
  ProjectAssigneeVm,
  ProjectsClient,
  StorageFile,
} from '@core/api';
import { environment } from '@env/environment';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  first,
  firstValueFrom,
  mergeMap,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';

export const PROJECT_MANAGER_BUSINESSTYPE_VALUE = 10;

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private projectUsers = new BehaviorSubject<Record<string, AccountListVm[]>>({});
  private readonly _accountsClient = inject(AccountsClient);
  private readonly _projectClient = inject(ProjectsClient);
  protected readonly _http = inject(HttpClient);

  projectUsers$ = this.projectUsers.asObservable();

  setprojectUsers(usersList: Record<string, AccountListVm[]>) {
    this.projectUsers.next(usersList);
  }

  getUsers(projectId: string, search: string): Observable<AccountListVm[]> {
    return this._projectClient
      .getProjectAssignees(projectId, environment.apiVersion)
      .pipe(
        concatMap((assignees: ProjectAssignees) => {
          let userIds: string[] = [];
          for (let businessType in assignees.groups) {
            for (let assignee of assignees.groups[businessType]) {
              userIds.push(assignee.userId);
            }
          }
          for (let manager of assignees.managers) {
            userIds.push(manager.userId);
          }
          return this._accountsClient
            .getBulk(search, environment.apiVersion, userIds)
            .pipe(
              tap((accountlist: AccountListVm[]) => {
                const groups: Record<string, ProjectAssigneeVm[]> = assignees.groups;
                const departmentUsers: Record<string, AccountListVm[]> = {};
                for (let busType in groups) {
                  const users: ProjectAssigneeVm[] = groups[busType];
                  for (let user of users) {
                    const userId: string = user.userId;
                    const bulkUser = accountlist.find((u) => u.id === userId);
                    for (var type in BusinessType) {
                      if (
                        bulkUser &&
                        type.toLocaleLowerCase() === busType.toLocaleLowerCase()
                      ) {
                        const value: string = BusinessType[type];
                        if (departmentUsers[value.toString()]) {
                          departmentUsers[value.toString()] = [
                            ...departmentUsers[value.toString()],
                            {
                              ...bulkUser,
                              department: +value,
                            } as AccountListVm & { department: number },
                          ];
                        } else {
                          departmentUsers[value.toString()] = [
                            {
                              ...bulkUser,
                              department: +value,
                            } as AccountListVm & { department: number },
                          ];
                        }
                      }
                    }
                  }
                }
                for (let manager of assignees.managers) {
                  const userId: string = manager.userId;
                  const bulkManager = accountlist.find((u) => u.id === userId);
                  if (
                    !(PROJECT_MANAGER_BUSINESSTYPE_VALUE.toString() in departmentUsers)
                  ) {
                    departmentUsers[PROJECT_MANAGER_BUSINESSTYPE_VALUE.toString()] = [
                      {
                        ...bulkManager,
                        department: PROJECT_MANAGER_BUSINESSTYPE_VALUE,
                      } as AccountListVm & { department: number },
                    ];
                  } else {
                    departmentUsers[PROJECT_MANAGER_BUSINESSTYPE_VALUE.toString()].push({
                      ...bulkManager,
                      department: PROJECT_MANAGER_BUSINESSTYPE_VALUE,
                    } as AccountListVm & { department: number });
                  }
                }
                this.projectUsers.next(departmentUsers);
              })
            );
        })
      );
  }

  upload(
    apiVersion: string,
    files: StorageFile[] | null | undefined,
    attachmentType: string | null | undefined,
    entityId: string | null | undefined = null
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

    if (entityId !== null && entityId !== undefined)
      content_.append('EntityId', entityId.toString());

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

  async getProjectVat(projectId: string): Promise<number> {
    const projectVat = await firstValueFrom(
      this._projectClient.getProjectVAT(projectId, environment.apiVersion)
    );
    return projectVat.vat;
  }

  async download(uniqueKey: string): Promise<string> {
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

    const response = await firstValueFrom(this._http.request('get', url_, options_));
    const blob = (response as any).body;
    let url = window.URL.createObjectURL(blob);
    return url;
  }
}
