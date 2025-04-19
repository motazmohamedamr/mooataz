import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private readonly _loadingService = inject(LoadingService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    this._loadingService.showLoading();

    return next.handle(request).pipe(
      finalize(() => {
        this._loadingService.hideLoading();
      })
    );
  }
}
