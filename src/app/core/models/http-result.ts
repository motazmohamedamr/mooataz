import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AbstractControl, FormGroup, FormArray } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProblemDetails, ValidationProblemDetails } from '@core/api';

export class HttpResult {
  private _validationErrors: { [key: string]: string[] } = {};
  private readonly _error: string = null;
  private readonly _errorKey: string = null;
  private readonly _notFound: boolean;

  constructor(
    error: ProblemDetails | ValidationProblemDetails | string,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {
    this._notFound = false;

    if (!error) {
      this._notFound = true;
    } else if (typeof error === 'string') {
      this._errorKey = error;
    } else if (error instanceof ValidationProblemDetails) {
      const err = (error as ValidationProblemDetails).errors;

      for (const e in err) {
        if (err.hasOwnProperty(e) && err[e] && err[e].length > 0) {
          this._validationErrors[e] = err[e];
        }
      }
    } else {
      const details = error as ProblemDetails;

      this._error = details.detail;
    }
  }

  /** Flag indicating whether the response not found. */
  get notFound(): boolean {
    return this._notFound;
  }

  /** Returns the validation errors if request failed or null if succeeded */
  assignValidationErrors(form: FormGroup): HttpResult {
    // Reset errors
    Object.keys(form.controls).forEach((key) => {
      form.get(key)?.setErrors(null);
    });

    for (const err in this._validationErrors) {
      if (this._validationErrors.hasOwnProperty(err)) {
        // remove data. at the start (if exists)
        const errKey = err.replace('data.', '');
        const errValue = this._validationErrors[err];
        this.setErrors(form, errKey, errValue);
      }
    }

    return this;
  }

  setErrors(control: AbstractControl, key: string, error: string[]): void {
    if (error && error.length > 0) {
      const parts = key.split('.');

      if (parts.length === 0) {
        return;
      }

      const newKey = this.joinKeys(parts);
      const part = this.getKey(parts[0]);

      // final piece
      if (parts.length === 1 && !part.includes('[')) {
        control?.get(part)?.setErrors({
          validation: error[0],
        });

        return;
      }

      // if it's an array
      if (part.includes('[')) {
        const match = part.match(/(\w*)\[(\d*)]/);
        // @ts-ignore
        const array = control.get(match[1]) as FormArray;

        // @ts-ignore
        this.setErrors(array.controls[+match[2]], newKey, error);

        return;
      }

      // still more to go
      this.setErrors(control?.get(part), newKey, error);
    }
  }

  /** Returns the bad request errors if request failed */
  assignErrors(errors: { detail: string; key: string }): HttpResult {
    if (this._error != null) {
      errors.detail = this._error;
    }

    if (this._errorKey != null) {
      errors.key = this._errorKey;
    }

    return this;
  }

  async pushError(): Promise<any> {
    if (!this._toastr || !this._translate) {
      return;
    }

    if (this.notFound) {
      return;
    } else if (this._error) {
      this._toastr.error(this._error, '', {
        positionClass: 'toast-bottom-center',
      });
    } else if (this._errorKey) {
      this._toastr.error(await firstValueFrom(this._translate.get(this._errorKey)), '', {
        positionClass: 'toast-bottom-center',
      });
    } else {
      this._toastr.error(
        await firstValueFrom(this._translate.get('errors.general')),
        '',
        {
          positionClass: 'toast-bottom-center',
        }
      );
    }
  }

  private joinKeys(parts: string[]): string {
    return parts.slice(1).join('.');
  }

  private getKey(part: string): string {
    return part.substring(0, 1).toLowerCase() + part.substring(1);
  }
}
