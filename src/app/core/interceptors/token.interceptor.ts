import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IdentityManager, TokenService } from '@core/auth';
import { environment } from '@env/environment';
import { NotificationService } from '@core/auth/services/notifications.service';

export const APP_VERSION = new InjectionToken<string>('APP_VERSION');

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    @Optional() @Inject(APP_VERSION) private readonly _version: string,
    private _router: Router,
    private _tokenService: TokenService,
    private _route: ActivatedRoute,
    private _notificationService: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers: any = {
      Version: this._version,
      Accept: 'application/json',
      'Accept-Language': localStorage.getItem('lang'),
      'X-Tenant-Identifier': environment.tenantIdentifier,
    };

    if (!environment.production) {
      headers['ngrok-skip-browser-warning'] = '69420';
    }

    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    for (const key in req.headers.keys()) {
      const val = req.headers.get(key);

      if (val && !headers.hasOwnProperty(key)) {
        headers[key] = val;
      }
    }

    const token = this._tokenService.token.value;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const clone = req.clone({ headers: new HttpHeaders(headers) });

    return next.handle(clone).pipe(catchError((err) => this.handleErrorReq(err)));
  }

  private handleErrorReq(err: HttpErrorResponse): Observable<never> {
    const returnUrl = this._route.snapshot.url.reduce(
      (path, currentSegment) => `${path}/${currentSegment.path}`,
      ''
    );

    // Create manually when needed as it can't be injected due to cascade dependencies
    const identityManager = new IdentityManager(
      null,
      null,
      this._tokenService,
      this._router,
      null,
      this._notificationService
    );

    switch (err.status) {
      case 401:
        identityManager.processLogout(returnUrl).subscribe();

        break;

      case 403:
        const user = identityManager.getUser();

        if (!user) {
          identityManager.processLogout(returnUrl).subscribe();
        }

        break;
    }

    return throwError(() => err);
  }
}
