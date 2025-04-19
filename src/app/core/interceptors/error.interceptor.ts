import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProblemDetails } from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly _toastr = inject(ToastrService);
  private readonly _translateService = inject(TranslateService);

  blobToText = (blob: any): Observable<string> => {
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
  };

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err && typeof err === 'object' && 'status' in err) {
          if (err.status === 401) {
            return next.handle(req);
          }
          if (err.status === 403) {
            this._toastr.error(this._translateService.instant('errors.err403'), '', {
              positionClass: 'toast-bottom-center',
            });
            return;
          }
        }
        if (err && typeof err === 'object' && 'url' in err) {
          if (
            err.url.includes('/api/v1/identity/refresh-token') ||
            err.url.includes('/api/v1/profile') ||
            err.url.includes('/api/v1/accounts/bulk') ||
            err.url.includes('/api/v1/notifications/page') ||
            err.url.includes('/extract-requests/last') ||
            err.url.includes('/logout')
          ) {
            return next.handle(req);
          }
        }
        const responseBlob =
          err instanceof HttpResponse
            ? err.body
            : (err as any).error instanceof Blob
            ? (err as any).error
            : undefined;

        return throwError(() => {
          let errText = this._translateService.instant('errors.general');
          if (errText === 'errors.general') {
            return err;
          }
          this.blobToText(responseBlob)
            .pipe(
              tap((_responseText) => {
                try {
                  const errObj = ProblemDetails.fromJS(JSON.parse(_responseText));
                  if (errObj.detail) {
                    errText = errObj.detail;
                  } else if (errObj.errors) {
                    const ers = Object.keys(errObj.errors);
                    errText = errObj.errors[ers[0]];
                  }
                } catch (err) {}
                this._toastr.error(errText, '', {
                  positionClass: 'toast-bottom-center',
                });
              })
            )
            .subscribe();

          return err;
        });
      })
    );
  }
}
