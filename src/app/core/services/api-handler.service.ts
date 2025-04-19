import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProblemDetails, ValidationProblemDetails } from '@core/api';
import { HttpResult } from '@core/models/http-result';

@Injectable({
  providedIn: 'root',
})
export class ApiHandlerService {
  constructor(
    private _toastr: ToastrService,
    private _translateService: TranslateService
  ) {}

  handleError(err: ProblemDetails | ValidationProblemDetails): HttpResult {
    if (!err || !err.hasOwnProperty('status')) {
      return this.handleAny();
    }

    switch (err.status) {
      case 400:
        return this.handle400(err);
      case 403:
        return this.handle403();
      case 404:
        return this.handle404(err);
      case 405:
        return this.handleUnsupportedVersion();
      case 422:
        return this.handle422(err as ValidationProblemDetails);
      case 500:
        return this.handle500();
      case 505:
        return this.handleUnsupportedVersion();
      default:
        return this.handleAny();
    }
  }

  private handle404(err: ProblemDetails): HttpResult {
    return this.createHttpResult(err.detail);
  }

  private handle422(err: ValidationProblemDetails): HttpResult {
    if (err.errors && Object.keys(err.errors).length < 1) {
      return this.createHttpResult('errors.err422');
    }

    return this.createHttpResult(err);
  }

  private handle400(err: ProblemDetails): HttpResult {
    return this.createHttpResult(err);
  }

  private handle403(): HttpResult {
    return this.createHttpResult('errors.err403');
  }

  private handle500(): HttpResult {
    return this.createHttpResult('errors.general');
  }

  private handleUnsupportedVersion(): HttpResult {
    return this.createHttpResult('errors.version');
  }

  private handleAny(): HttpResult {
    return this.createHttpResult('errors.general');
  }

  private createHttpResult(error: any): HttpResult {
    return new HttpResult(error, this._toastr, this._translateService);
  }
}
